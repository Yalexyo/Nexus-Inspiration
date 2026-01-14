import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export type AssetType = 'image' | 'video' | 'website';

export interface MediaAsset {
    type: AssetType;
    content: string | File; // URL string or File object
    preview?: string; // For UI display (blob URL)
}

export interface Inspiration {
    id: string;
    user_id: string;
    title: string;
    description: string;
    assets: MediaAsset[];
    tags: string[];
    createdAt: string;
}

const STORAGE_KEY = 'nexus_inspirations';

// Helper to get file extension
function getFileExt(file: File): string {
    const name = file.name;
    const lastDot = name.lastIndexOf('.');
    return lastDot === -1 ? '' : name.substring(lastDot + 1);
}

// Helper to convert base64 to Blob (Legacy support)
async function base64ToBlob(base64: string): Promise<Blob> {
    const res = await fetch(base64);
    return await res.blob();
}

export async function uploadAsset(assetContent: string | File): Promise<string> {
    const user = getCurrentUser();
    const userId = user ? user.id : 'anon';
    const folder = `media/${userId}`;

    let blob: Blob;
    let fileExt: string;

    if (assetContent instanceof File) {
        blob = assetContent;
        fileExt = getFileExt(assetContent) || assetContent.type.split('/')[1];
    } else {
        // Handle Base64 (Legacy or small images)
        if (!assetContent.startsWith('data:')) return assetContent; // Already a URL
        blob = await base64ToBlob(assetContent);
        fileExt = blob.type.split('/')[1];
    }

    // Sanity check for file size before upload attempt (120MB limit)
    const MAX_SIZE = 120 * 1024 * 1024;
    if (blob.size > MAX_SIZE) {
        throw new Error(`File too large: ${(blob.size / 1024 / 1024).toFixed(2)}MB. Max allowed is 120MB.`);
    }

    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, blob);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

    return publicUrl;
}

export async function getInspirations(): Promise<Inspiration[]> {
    const user = getCurrentUser();
    if (!user) return [];

    let query = supabase
        .from('inspirations')
        .select('*')
        .order('created_at', { ascending: false });

    // Only filter by user_id if NOT in God Mode
    if (user.id !== 'god') {
        query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Supabase fetch error:", error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        title: item.title,
        description: item.description,
        assets: item.assets,
        tags: item.tags,
        createdAt: item.created_at
    }));
}

export async function saveInspiration(item: Omit<Inspiration, 'id' | 'createdAt' | 'user_id'>) {
    const user = getCurrentUser();
    if (!user) throw new Error("User must be logged in to save.");

    // 1. Process Assets: Upload local base64 to Supabase Storage
    const processedAssets = await Promise.all(
        item.assets.map(async (asset) => ({
            type: asset.type,
            content: await uploadAsset(asset.content)
        }))
    );

    // 2. Save to Supabase DB with user_id
    const { data, error } = await supabase
        .from('inspirations')
        .insert([{
            user_id: user.id, // Set Owner
            title: item.title,
            description: item.description,
            assets: processedAssets,
            tags: item.tags
        }])
        .select();

    if (error) throw error;

    return data[0];
}

export async function deleteInspiration(id: string) {
    const user = getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('inspirations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Security: Check owner

    if (error) throw error;
}
