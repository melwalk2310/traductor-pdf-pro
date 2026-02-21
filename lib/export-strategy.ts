export interface ExportOptions {
    title: string;
    content: string;
    author?: string;
}

export interface ExportStrategy {
    execute(options: ExportOptions): Promise<string | Buffer | Uint8Array>;
}

export class PdfExportStrategy implements ExportStrategy {
    async execute(options: ExportOptions): Promise<string> {
        console.log(`[SRE] Generando PDF para: ${options.title}`);
        return `PDF_BASE64_PLACEHOLDER_FOR_${options.title}`;
    }
}

export class EpubExportStrategy implements ExportStrategy {
    async execute(options: ExportOptions): Promise<Buffer> {
        const { default: snarkdown } = await import("snarkdown");
        const { default: epub } = await import("epub-gen-memory");

        console.log(`[SRE] Iniciando generación de EPUB: ${options.title}`);

        const htmlContent = snarkdown(options.content);
        const validatedHtml = `<div>${htmlContent}</div>`;

        const epubOptions = {
            title: options.title,
            author: options.author || "Traductor PDF Pro",
            publisher: "Resilient Translation Asset",
            css: `
                body { font-family: sans-serif; font-size: 12pt; line-height: 1.5; padding: 20px; }
                h1, h2, h3 { color: #1e293b; margin-top: 1.5em; }
                p { margin-bottom: 1em; }
                code { background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
                pre { background: #f1f5f9; padding: 15px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 0.9em; }
            `
        };

        const chapters = [{ title: "Traducción", content: validatedHtml }];

        try {
            const buffer = await epub(epubOptions, chapters);
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

export class ExporterContext {
    private strategy: ExportStrategy;
    constructor(strategy: ExportStrategy) { this.strategy = strategy; }
    setStrategy(strategy: ExportStrategy) { this.strategy = strategy; }
    async export(options: ExportOptions): Promise<string | Buffer | Uint8Array> {
        return await this.strategy.execute(options);
    }
}
