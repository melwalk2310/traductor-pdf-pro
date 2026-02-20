import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const translateText = async (text: string, targetLanguage: string = "Spanish") => {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY no está configurada en el servidor.");
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `You are an expert technical translator. 
    Context: Technical documentation (PDF/EPUB).
    Task: Translate high-quality technical content from any language to ${targetLanguage}.
    Constraints:
    - Respect and maintain all Markdown/HTML tags and structure.
    - Preserve formatting, headings, and code blocks.
    - Provide a natural, professional translation for a technical audience.
    - Do not add any conversational filler. Just return the translated content.`,
    });

    const prompt = `Translate the following content to ${targetLanguage}:\n\n${text}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini Translation Error:", error);
        const message = error?.message || "Error desconocido en Gemini API";
        throw new Error(`Error de Gemini: ${message}`);
    }
};
