/**
 * Unified Translation Service with SRE High Availability Fallback
 * Strategy: GROQ (Primary) -> GEMINI (Backup)
 */
export const translateContent = async (text: string, targetLanguage: string) => {
    const { translateText: translateWithGemini, TranslationError } = await import("./gemini");
    const { translateWithGroq } = await import("@/src/lib/groq");

    const hasGroq = !!process.env.GROQ_API_KEY;

    // Pandoc-like logic: Ensure text is treated as Markdown
    const processedInput = text.trim();
    let translatedText = "";

    // 1. Intentar con GROQ (Primary LPU)
    if (hasGroq) {
        try {
            console.log("[SRE] Iniciando traducción con GROQ (Primary)...");
            translatedText = await translateWithGroq(processedInput, targetLanguage);
        } catch (error: any) {
            console.warn("[SRE] Fallo en GROQ. Ejecutando fallback a GEMINI...", error.message);
        }
    }

    // 2. Fallback a GEMINI (High Availability Backup)
    if (!translatedText) {
        try {
            console.log("[SRE] Fallback: Iniciando traducción con GEMINI...");
            translatedText = await translateWithGemini(processedInput, targetLanguage);
        } catch (error: any) {
            if (error instanceof TranslationError) throw error;

            throw new TranslationError(
                "Error persistente en todos los motores de traducción (Groq & Gemini).",
                "MULTI_ENGINE_FAILURE"
            );
        }
    }

    // Sanitización (Pandoc Logic): Extraer solo el contenido Markdown si Groq añade explicaciones
    // Groq a veces añade frases antes o después del código.
    const codeBlockRegex = /```(?:markdown|md)?\s*([\s\S]*?)\s*```/i;
    const match = translatedText.match(codeBlockRegex);
    const sanitizedText = match ? match[1] : translatedText;

    // Verificación de Contenido (Rigor SRE): Prevenir archivos corruptos o vacíos
    if (!sanitizedText || sanitizedText.trim().length < 10) {
        throw new TranslationError(
            "Contenido insuficiente devuelto por la IA. El archivo no se generará.",
            "INSUFFICIENT_CONTENT"
        );
    }

    return sanitizedText.trim();
};
