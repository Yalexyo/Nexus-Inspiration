export interface Inspiration {
    id: string;
    title: string;
    description: string;
    mediaType: 'url' | 'upload';
    mediaContent: string; // URL string or Data URL
    tags: string[];
    createdAt: string;
}

const STORAGE_KEY = 'nexus_inspirations';

export function getInspirations(): Inspiration[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error("Failed to parse stored inspirations:", e);
        return [];
    }
}

export function saveInspiration(item: Omit<Inspiration, 'id' | 'createdAt'>) {
    const current = getInspirations();
    const newItem: Inspiration = {
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newItem, ...current]));
    return newItem;
}

export function deleteInspiration(id: string) {
    const current = getInspirations();
    const updated = current.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
