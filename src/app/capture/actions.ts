'use server';

import { generateMetadata, SuggestionResult } from "@/lib/gemini";

export async function getAiSuggestions(
    description: string,
    tags: string[]
): Promise<{ success: boolean; data?: SuggestionResult }> {
    try {
        const result = await generateMetadata(description, tags);
        if (!result) return { success: false };
        return { success: true, data: result };
    } catch (e) {
        return { success: false };
    }
}
