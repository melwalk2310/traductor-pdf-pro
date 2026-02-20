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

    // List of models to try in sequence to bypass specific quota limits or 404s
    const modelsToTry = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-pro"
    ];

    let lastError: any = null;

    for (const modelId of modelsToTry) {
        try {
            console.log(`[Asset] Intentando traducción con modelo: ${modelId}`);
            const model = genAI.getGenerativeModel({
                model: modelId,
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
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            lastError = error;
            console.error(`[Asset] Error con modelo ${modelId}:`, error.message);

            // If it's a quota error (429), we try the next model immediately
            // If it's a 404, we try the next model
            if (error.message?.includes("429") || error.message?.includes("404")) {
                continue;
            }
            // For other critical errors, we stop
            throw error;
        }
    }

    // If we reach here, all models failed
    const finalMessage = lastError?.message || "Todos los modelos de Gemini fallaron o tienen la cuota agotada.";
    throw new Error(`[v2.0.2] Error Crítico de Gemini: ${finalMessage}`);
};
