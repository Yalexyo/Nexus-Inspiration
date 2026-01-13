import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export interface SuggestionResult {
    title: string;
    primary_tag: string;
    secondary_tag: string;
}

export async function generateMetadata(
    description: string,
    predefinedTags: string[] = []
): Promise<SuggestionResult | null> {
    if (!apiKey) {
        console.warn("GEMINI_API_KEY is not set.");
        return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING },
                    primary_tag: { type: SchemaType.STRING },
                    secondary_tag: { type: SchemaType.STRING },
                }
            }
        }
    });

    const prompt = `
    Analyze this user description and generate a structured summary.
    Context (Project Nexus): A system to capture inspiration.
    
    User Description: "${description}"
    
    Task:
    1. Generate a concise Title (max 15 chars, capture the essence).
    2. Suggest a Primary Tag and a Secondary Tag. 
       Prefer matching these Predefined Tags: ${JSON.stringify(predefinedTags)}.
       If no match, suggest a new relevant tag.
    
    Output JSON.
  `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return JSON.parse(text) as SuggestionResult;
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        return null;
    }
}
