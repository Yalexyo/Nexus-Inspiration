import { getCurrentUser } from './auth';

export type AssetType = 'image' | 'video' | 'website' | 'pdf';

export interface MediaAsset {
    type: AssetType;
    content: string | File; // URL string or File object
    preview?: string; // For UI display (blob URL)
}

export const CATEGORIES = ['政策', '经济', '社会', '技术', '创意', '竞品动态'] as const;
export type Category = typeof CATEGORIES[number];

export const SUBCATEGORIES = ['产品', '品牌', '软件UI', '视频', '其他'] as const;
export type Subcategory = typeof SUBCATEGORIES[number];

export const DESIGN_CATEGORY = '创意' as const;

export const SOURCE_OPTIONS = ['网络', '展会', '交流会', '客户现场', '其他'] as const;
export type SourceOption = typeof SOURCE_OPTIONS[number];

// 后续动作标签：单选，可为空。看完一条灵感后标一下"这条接下来该干嘛"
export const FOLLOW_UPS = ['继续深入调查', '内容结构进一步优化', '升级成分享内容', '考虑项目应用'] as const;
export type FollowUp = typeof FOLLOW_UPS[number];

export interface Inspiration {
    id: string;
    card_no: number;
    user_id: string;
    category: Category;
    subcategory: Subcategory | null;
    title: string;
    description: string;
    source: SourceOption | null;
    source_text: string;
    design_insight: string;
    assets: MediaAsset[];
    tags: string[];
    follow_up: FollowUp | null;
    follow_up_by: string | null;   // 标记人的 user_id
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

function mapInspiration(item: any): Inspiration {
    return {
        id: item.id,
        card_no: item.card_no,
        user_id: item.user_id,
        category: item.category || '政策',
        subcategory: item.subcategory || null,
        title: item.title,
        description: item.description,
        source: item.source || null,
        source_text: item.source_text || '',
        design_insight: item.design_insight || '',
        assets: item.assets || [],
        tags: item.tags || [],
        follow_up: item.follow_up || null,
        follow_up_by: item.follow_up_by || null,
        createdAt: item.created_at
    };
}

export async function getInspirations(): Promise<Inspiration[]> {
    try {
        const res = await fetch('/api/inspirations');
        if (!res.ok) return [];
        const data = await res.json();
        return data.map(mapInspiration);
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
}

export async function getInspirationById(id: string): Promise<Inspiration | null> {
    try {
        const res = await fetch(`/api/inspirations/${encodeURIComponent(id)}`);
        if (!res.ok) return null;
        const data = await res.json();
        return mapInspiration(data);
    } catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
}

// 只改后续动作标签，不动其它字段。传 null 表示取消标记。
// 走独立端点：这是唯一一个非上传人也能写的字段（全员协作的分拣动作）
export async function setFollowUp(id: string, followUp: FollowUp | null) {
    const user = getCurrentUser();
    if (!user) throw new Error("请先登录再标记");

    const res = await fetch(`/api/inspirations/${id}/follow-up`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, follow_up: followUp })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update follow-up');
    }
}

// 新建时后续动作标签可以不填（新灵感默认没有标记，看过之后再标）
export async function saveInspiration(item: Omit<Inspiration, 'id' | 'card_no' | 'createdAt' | 'user_id' | 'follow_up' | 'follow_up_by'> & { follow_up?: FollowUp | null }) {
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
                source: item.source,
                source_text: item.source_text,
                design_insight: item.design_insight,
                assets: processedAssets,
                tags: item.tags,
                follow_up: item.follow_up ?? null
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

export async function updateInspiration(id: string, updates: Partial<Pick<Inspiration, 'title' | 'description' | 'tags' | 'assets' | 'category' | 'subcategory' | 'source' | 'source_text' | 'design_insight' | 'follow_up'>>) {
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
