"use server";

import { translateText } from "@/lib/gemini";
import { ExporterContext, PdfExportStrategy, EpubExportStrategy, ExportOptions } from "@/lib/export-strategy";

export async function processTranslation(
    content: string,
    sourceLang: string,
    targetLang: string,
    title: string,
    format: "pdf" | "epub"
) {
    try {
        // Pandoc-like Pre-processing: Ensure content is treated as Markdown
        // (Content is already structured in document-processor.ts)
        const translatedContent = await translateText(content, targetLang);

        const options: ExportOptions = {
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
        // Note: Since we are on the server, we might return the translated content or a base64 string
        // because returning a Blob from a server action can be tricky depending on the environment.
        // For simplicity in this functional prototype, we'll return the translated content and format it client-side
        // OR return a base64 version of the file.

        return {
            success: true,
            translatedContent,
            title: `${title} (${targetLang})`,
        };
    } catch (error: any) {
        console.error("Server Action Error:", error);
        return { success: false, error: error?.message || "Error desconocido en el servidor." };
    }
}
