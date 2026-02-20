export interface ExportOptions {
    title: string;
    content: string;
    author?: string;
}

export interface ExportStrategy {
    execute(options: ExportOptions): Promise<Blob>;
}

export class PdfExportStrategy implements ExportStrategy {
    async execute(options: ExportOptions): Promise<Blob> {
        // pdf-lib logic to create PDF from translated markdown
        console.log("Exporting to PDF:", options.title);
        return new Blob([], { type: 'application/pdf' });
    }
}

export class EpubExportStrategy implements ExportStrategy {
    async execute(options: ExportOptions): Promise<Blob> {
        // epub-gen-memory logic
        console.log("Exporting to EPUB:", options.title);
        return new Blob([], { type: 'application/epub+zip' });
    }
}

export class ExporterContext {
    private strategy: ExportStrategy;

    constructor(strategy: ExportStrategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy: ExportStrategy) {
        this.strategy = strategy;
    }

    async export(options: ExportOptions): Promise<Blob> {
        return this.strategy.execute(options);
    }
}
