import snarkdown from "snarkdown";
import epub from "epub-gen-memory";

export interface ExportOptions {
    title: string;
    content: string;
    author?: string;
}

export interface ExportStrategy {
    execute(options: ExportOptions): Promise<string | Buffer | Uint8Array>;
}

/**
 * PDF Export Strategy: Generates a high-fidelity PDF.
 * (Currently returns a marker string since PDF libraries can be complex for serverles environments, 
 * but follows the same async awaited pattern)
 */
export class PdfExportStrategy implements ExportStrategy {
    async execute(options: ExportOptions): Promise<string> {
        console.log(`[SRE] Generando PDF para: ${options.title}`);
        // Return placeholder or implement pdf-lib logic
        return `PDF_BASE64_PLACEHOLDER_FOR_${options.title}`;
    }
}

/**
 * EPUB Export Strategy: Generates a valid EPUB with HTML conversion.
 * Logic: Markdown (AI) -> HTML (Snarkdown) -> EPUB (epub-gen-memory)
 */
export class EpubExportStrategy implements ExportStrategy {
    async execute(options: ExportOptions): Promise<Buffer> {
        console.log(`[SRE] Iniciando generación de EPUB: ${options.title}`);

        // Pandoc Logic: Convert Markdown to valid HTML/XHTML for EPUB
        // We wrap it in simple HTML structure to avoid parsing errors in readers
        const htmlContent = snarkdown(options.content);
        const validatedHtml = `<div>${htmlContent}</div>`;

        const epubOptions = {
            title: options.title,
            author: options.author || "Traductor PDF Pro",
            publisher: "Resilient Translation Asset",
        };

        const chapters = [
            {
                title: "Traducción",
                content: validatedHtml,
            },
        ];

        try {
            // Awaited Generation: Strict async flow to ensure buffer is full
            const buffer = await epub(epubOptions, chapters);

            // SRE Check: Initial size validation on server
            if (!buffer || buffer.length < 100) {
                throw new Error("EPUB buffer corruption: Size too small.");
            }

            console.log(`[SRE] EPUB generado exitosamente. Tamaño: ${buffer.length} bytes.`);
            return buffer;
        } catch (error: any) {
            console.error("[SRE] EPUB Generation Failed:", error.message);
            throw new Error(`Error de integridad EPUB: ${error.message}`);
        }
    }
}

/**
 * Strategy Context
 */
export class ExporterContext {
    private strategy: ExportStrategy;

    constructor(strategy: ExportStrategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy: ExportStrategy) {
        this.strategy = strategy;
    }

    async export(options: ExportOptions): Promise<string | Buffer | Uint8Array> {
        return await this.strategy.execute(options);
    }
}
