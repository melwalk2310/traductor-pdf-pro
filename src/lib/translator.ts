import { translateContent } from "@/lib/translation-service";
import { chunkText } from "@/lib/text-utils";

/**
 * Pipeline de Traducción por Lotes 4.0.0
 * Procesa textos largos evitando truncamiento y Rate Limits.
 */
export async function batchTranslate(
    text: string,
    targetLang: string,
    onProgress?: (current: number, total: number) => void
): Promise<string> {
    // Bucle de Segmentación (Thomas Mailund Pattern)
    const chunks = chunkText(text, 4000);
    const results: string[] = [];
    const totalChunks = chunks.length;

    console.log(`[Batch 4.0] Iniciando pipeline para ${totalChunks} fragmentos.`);

    let i = 1;
    for (const chunk of chunks) {
        if (onProgress) onProgress(i, totalChunks);

        console.log(`[Batch 4.0] Traduciendo parte ${i}/${totalChunks}...`);

        try {
            const translated = await translateContent(chunk, targetLang);
            results.push(translated);

            // Implementa un pequeño retraso (delay) de 500ms (SRE Resilience)
            if (i < totalChunks) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error: any) {
            console.error(`[Batch 4.0] Error en fragmento ${i}:`, error.message);
            throw new Error(`Error en el Pipeline de Lote (Parte ${i}): ${error.message}`);
        }

        i++;
    }

    // Acumulación de Datos: Reconstrucción Semántica Completa
    return results.join("\n\n");
}
