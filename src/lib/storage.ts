import { getCurrentUser } from './auth';

export type AssetType = 'image' | 'video' | 'website';

export interface MediaAsset {
    type: AssetType;
    content: string | File; // URL string or File object
    preview?: string; // For UI display (blob URL)
}

export const CATEGORIES = ['政策', '经济', '社会', '技术', '设计灵感'] as const;
export type Category = typeof CATEGORIES[number];

export const SUBCATEGORIES = ['产品', '品牌', '软件UI', '视频', '其他'] as const;
export type Subcategory = typeof SUBCATEGORIES[number];

export const DESIGN_CATEGORY = '设计灵感' as const;

export interface Inspiration {
    id: string;
    user_id: string;
    category: Category;
    subcategory: Subcategory | null;
    title: string;
    description: string;
    assets: MediaAsset[];
    tags: string[];
    createdAt: string;
}

function toActionableError(error: unknown): Error {
    return error instanceof Error ? error : new Error('Unexpected error while saving inspiration.');
}

export async function uploadAsset(assetContent: string | File): Promise<string> {
    const user = getCurrentUser();
    const userId = user ? user.id : 'anon';

    if (assetContent instanceof File) {
        const formData = new FormData();
        formData.append('file', assetContent);
        formData.append('user_id', userId);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Upload failed');
        }
        const data = await res.json();
        return data.url;
    }

    // Already a URL string — return as-is
    return assetContent;
}

export async function getInspirations(): Promise<Inspiration[]> {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const res = await fetch('/api/inspirations');
        if (!res.ok) return [];
        const data = await res.json();

        return data.map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            category: item.category || '政策',
            subcategory: item.subcategory || null,
            title: item.title,
            description: item.description,
            assets: item.assets || [],
            tags: item.tags || [],
            createdAt: item.created_at
        }));
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
}

export async function saveInspiration(item: Omit<Inspiration, 'id' | 'createdAt' | 'user_id'>) {
    const user = getCurrentUser();
    if (!user) throw new Error("User must be logged in to save.");

    try {
        // 1. Upload file assets
        const processedAssets = await Promise.all(
            item.assets.map(async (asset) => ({
                type: asset.type,
                content: await uploadAsset(asset.content)
            }))
        );

        // 2. Save to DB via API
        const res = await fetch('/api/inspirations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                category: item.category,
                subcategory: item.subcategory,
                title: item.title,
                description: item.description,
                assets: processedAssets,
                tags: item.tags
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to save');
        }

        return await res.json();
    } catch (error) {
        throw toActionableError(error);
    }
}

export async function updateInspiration(id: string, updates: Partial<Pick<Inspiration, 'title' | 'description' | 'tags' | 'assets' | 'category' | 'subcategory'>>) {
    const user = getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    let processedUpdates: any = { ...updates };

    // Upload new File assets
    if (updates.assets) {
        const processedAssets = await Promise.all(
            updates.assets.map(async (asset) => ({
                type: asset.type,
                content: await uploadAsset(asset.content)
            }))
        );
        processedUpdates.assets = processedAssets;
    }

    const res = await fetch(`/api/inspirations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: user.id,
            ...processedUpdates
        })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
    }
}

export async function deleteInspiration(id: string) {
    const user = getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const res = await fetch(`/api/inspirations/${id}?user_id=${encodeURIComponent(user.id)}`, {
        method: 'DELETE'
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
    }
}
