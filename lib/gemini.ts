import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Exponential Backoff Utility for SRE resilience.
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Profesional Semantic Error Class
 */
export class TranslationError extends Error {
    constructor(message: string, public readonly code: string, public readonly status?: number) {
        super(message);
        this.name = "TranslationError";
    }
}

/**
 * Technical Translation Service (Refined Asset)
 * Model: gemini-1.5-flash (Optimized for speed/context)
 */
export const translateText = async (
    text: string,
    targetLanguage: string = "Spanish",
    retries = 3
) => {
    const rawApiKey = process.env.GEMINI_API_KEY || "";

    if (!rawApiKey) {
        throw new TranslationError(
            "Configuración incompleta: GEMINI_API_KEY no encontrada.",
            "ENV_MISSING"
        );
    }

    // Clean API Key
    const apiKey = rawApiKey.trim().replace(/^['"]|['"]$/g, "");
    const genAI = new GoogleGenerativeAI(apiKey);

    // Pandoc Logic (Thomas Mailund): Data in Markdown reduces tokens and improves fidelity.
    // We ensure the input is treated as a structured block if it's not already Markdown-heavy.
    const processedText = text.trim();

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `You are an expert technical translator. 
    Task: Translate Markdown content to ${targetLanguage}.
    SRE Constraints:
    - Preserve all Markdown structural elements (headers, tables, code blocks).
    - Return ONLY the translated Markdown. No conversational filler.
    - If input is not in Markdown, convert the output to high-fidelity Markdown.`,
    });

    const prompt = `Translate this technical content to ${targetLanguage}. Maintain Markdown integrity:\n\n${processedText}`;

    let delay = 2000; // Starting delay for backoff

    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const translatedText = response.text();

            if (!translatedText) throw new Error("Empty response from AI");
            return translatedText;

        } catch (error: any) {
            const status = error?.status || 0;
            const message = error?.message || "";

            // Handle 429 (Rate Limit) with Exponential Backoff
            if (status === 429 || message.includes("429") || message.includes("quota")) {
                if (i < retries - 1) {
                    console.warn(`[SRE] Rate limit detected. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                    await wait(delay);
                    delay *= 2; // Exponential backoff
                    continue;
                }
                throw new TranslationError(
                    "Límite de cuota alcanzado. Por favor, espera un momento antes de reintentar.",
                    "RATE_LIMIT_EXCEEDED",
                    429
                );
            }

            // Handle 404 (Model not found/Regional issues)
            if (status === 404 || message.includes("404")) {
                throw new TranslationError(
                    "El motor de inteligencia artificial no está disponible en esta región. Verifica la configuración del modelo.",
                    "MODEL_NOT_FOUND",
                    404
                );
            }

            // Generic Semantic Error
            throw new TranslationError(
                "Error interno durante la traducción semántica del documento.",
                "INTERNAL_PROCESSING_ERROR"
            );
        }
    }

    throw new TranslationError(
        "Error persistente tras varios reintentos. Verifica tu conexión o cuota de API.",
        "PERSISTENT_FAILURE"
    );
};
