"use server";

import { translateContent } from "@/lib/translation-service";
import { ExporterContext, PdfExportStrategy, EpubExportStrategy, ExportOptions } from "@/lib/export-strategy";

export async function processTranslation(
    content: string,
    sourceLang: string,
    targetLang: string,
    title: string,
    format: "pdf" | "epub"
) {
    try {
        const translatedContent = await translateContent(content, targetLang);

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
        const fileData = await exporter.export(options);

        let base64Data = "";
        if (typeof fileData === "string") {
            base64Data = Buffer.from(fileData).toString("base64");
        } else {
            base64Data = fileData.toString("base64");
        }

        console.log(`[SRE Monitor] Traducción y Exportación (${format}) exitosa. Tamaño base64: ${base64Data.length}`);

        return {
            success: true,
            fileData: base64Data,
            translatedContent,
            title: `${title} (${targetLang})`,
            format
        };
    } catch (error: any) {
        console.error("Server Action Error:", error);
        return { success: false, error: error?.message || "Error desconocido en el servidor." };
    }
}
