import { translateText as translateWithGemini, TranslationError } from "./gemini";
import { translateWithGroq } from "./groq";

/**
 * Unified Translation Service with SRE High Availability Fallback
 * Strategy: GROQ (Primary) -> GEMINI (Backup)
 */
export const translateContent = async (text: string, targetLanguage: string) => {
    const hasGroq = !!process.env.GROQ_API_KEY;

    // Pandoc-like logic: Ensure text is treated as Markdown
    const processedInput = text.trim();

    // 1. Intentar con GROQ (Primary LPU)
    if (hasGroq) {
        try {
            console.log("[SRE] Iniciando traducción con GROQ (Primary)...");
            return await translateWithGroq(processedInput, targetLanguage);
        } catch (error: any) {
            console.warn("[SRE] Fallo en GROQ. Ejecutando fallback a GEMINI...", error.message);
        }
    }

    // 2. Fallback a GEMINI (High Availability Backup)
    try {
        console.log("[SRE] Fallback: Iniciando traducción con GEMINI...");
        return await translateWithGemini(processedInput, targetLanguage);
    } catch (error: any) {
        if (error instanceof TranslationError) throw error;

        throw new TranslationError(
            "Error persistente en todos los motores de traducción (Groq & Gemini).",
            "MULTI_ENGINE_FAILURE"
        );
    }
};
