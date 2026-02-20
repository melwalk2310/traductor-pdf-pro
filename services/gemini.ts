import { GoogleGenerativeAI } from "@google/generative-ai";

export const translateText = async (text: string, targetLanguage: string = "Spanish") => {
    const rawApiKey = process.env.GEMINI_API_KEY || "";

    if (!rawApiKey) {
        throw new Error("GEMINI_API_KEY no está configurada en el servidor (Vercel Settings > Environment Variables).");
    }

    // Clean the key in case the user pasted "KEY=VALUE" or included quotes
    let cleanApiKey = rawApiKey.trim();
    if (cleanApiKey.includes("=")) {
        // If they pasted "GEMINI_API_KEY=AIza...", extract only the value
        cleanApiKey = cleanApiKey.split("=").pop() || cleanApiKey;
    }
    // Remove potential surrounding quotes
    cleanApiKey = cleanApiKey.replace(/^['"]|['"]$/g, "");

    const genAI = new GoogleGenerativeAI(cleanApiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
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
        const message = error?.message || "Error desconocido en Gemini API. Verifica que la API Key sea válida.";
        throw new Error(`[v2.0-flash] Error de Gemini: ${message}`);
    }
};
