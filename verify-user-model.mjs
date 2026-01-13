import { GoogleGenerativeAI } from "@google/generative-ai";

async function verify() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "gemini-flash-latest";

    try {
        console.log(`Testing specific model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello!");
        console.log(`✅ Success with ${modelName}! AI Response:`, result.response.text().trim());
    } catch (error) {
        console.error(`❌ ${modelName} failed: ${error.message}`);
        process.exit(1);
    }
}

verify();
