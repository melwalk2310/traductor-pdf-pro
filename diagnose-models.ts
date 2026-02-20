import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY || "";

async function listModels() {
    if (!apiKey) {
        console.error("No API key found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // Note: The SDK might not have a direct listModels, we might need a fetch call
        // or use the internal method if available. 
        // In @google/generative-ai, listModels is not always obvious.
        // Let's try to just hit a known model and if it fails, try the next one.

        const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];

        for (const modelName of models) {
            console.log(`Checking ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("test");
                console.log(`✅ ${modelName} works!`);
                return modelName;
            } catch (e: any) {
                console.log(`❌ ${modelName} failed: ${e.message}`);
            }
        }
    } catch (error) {
        console.error("Diagnostics failed:", error);
    }
}

listModels();
