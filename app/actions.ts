"use server";

/**
 * SRE Action: Extrae texto completo del PDF en el servidor
 * Utiliza importación dinámica para evitar que pdf-parse rompa el SSR del cliente.
 */
export async function extractTextAction(base64File: string) {
    try {
        const { extractPdfContent } = await import("@/lib/document-processor");
        const nodeBuffer = Buffer.from(base64File, "base64");
        // Convert Node Buffer to ArrayBuffer
        const arrayBuffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
        const doc = await extractPdfContent(arrayBuffer);
        return { success: true, content: doc.content, title: doc.title };
    } catch (error: any) {
        console.error("[SRE] extraction error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * SRE Action: Traduce un solo fragmento de forma aislada
 */
export async function translateChunkAction(text: string, targetLang: string) {
    try {
        const { translateContent } = await import("@/lib/translation-service");
        const translated = await translateContent(text, targetLang);
        return { success: true, translated };
    } catch (error: any) {
        console.error("[SRE] chunk translation error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * SRE Action: Procesa el ensamblado final y generación del archivo
 */
export async function processTranslation(
    content: string,
    sourceLang: string,
    targetLang: string,
    title: string,
    format: "pdf" | "epub"
) {
    try {
        const { ExporterContext, PdfExportStrategy, EpubExportStrategy } = await import("@/lib/export-strategy");

        // En este flujo 4.0.1, el contenido YA viene traducido del cliente
        const translatedContent = content;

        const options = {
            title,
            content: translatedContent,
            author: "Traductor PDF Pro",
        };

        let strategy;
        if (format === "pdf") {
            strategy = new PdfExportStrategy();
        } else {
            strategy = new EpubExportStrategy();
        }

        const exporter = new ExporterContext(strategy);
        const fileData = await exporter.export(options);

        let base64Data = "";
        if (typeof fileData === "string") {
            base64Data = Buffer.from(fileData).toString("base64");
        } else {
            base64Data = (fileData as any).toString("base64");
        }

        return {
            success: true,
            fileData: base64Data,
            title: `${title} (${targetLang})`,
            format
        };
    } catch (error: any) {
        console.error("Server Action Error:", error);
        return { success: false, error: error?.message || "Error desconocido en el servidor." };
    }
}
