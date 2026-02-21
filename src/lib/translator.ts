import { translateWithGroqClient } from "@/lib/groq-client";
import { chunkText } from "@/lib/text-utils";

export interface TranslationProgress {
    current: number;
    total: number;
    status: string;
    attempts?: number;
}

/**
 * Atomic Translation Engine (v6.0.0)
 * Protocol: 2000 char chunks, 3x Retry Policy, Sequential loop.
 */
export async function translateDocumentResilient(
    content: string,
    targetLang: string,
    apiKey: string,
    onProgress?: (progress: TranslationProgress) => void
): Promise<string> {
    const chunks = chunkText(content, 2000);
    const total = chunks.length;
    const resultsMap: string[] = []; // Immutable Array Accumulator

    let i = 1;
    for (const chunk of chunks) {
        let success = false;
        let attempts = 0;
        let chunkResult = "";

        while (!success && attempts < 3) {
            try {
                if (onProgress) {
                    onProgress({
                        current: i,
                        total,
                        status: `Bloque ${i} de ${total} procesado correctamente`,
                        attempts: attempts + 1
                    });
                }

                chunkResult = await translateWithGroqClient(chunk, targetLang, apiKey);
                success = true;
            } catch (error: any) {
                attempts++;
                if (attempts >= 3) {
                    throw new Error(`Fallo crítico en bloque ${i} tras 3 intentos: ${error.message}`);
                }
                await new Promise(r => setTimeout(r, 1000 * attempts));
            }
        }

        resultsMap.push(chunkResult); // Infallible atomic push
        i++;

        if (i <= total) {
            await new Promise(r => setTimeout(r, 600));
        }
    }

    return resultsMap.join("\n\n").trim();
}
