"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Download, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { extractPdfContent } from "@/lib/document-processor";
import { chunkText } from "@/lib/text-utils";
import { translateWithGroqClient } from "@/lib/groq-client";
import { processTranslation } from "@/app/actions";

export default function BatchTranslator() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<"idle" | "extracting" | "translating" | "exporting" | "done" | "error">("idle");
    const [details, setDetails] = useState("");
    const [targetLang, setTargetLang] = useState("es");
    const [exportFormat, setExportFormat] = useState<"pdf" | "epub">("epub");
    const [apiKey, setApiKey] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
            setStatus("idle");
            setDetails("");
            setProgress(0);
        }
    };

    const startPipeline = async () => {
        if (!file) return;
        if (!apiKey) {
            setStatus("error");
            setDetails("Por favor, introduce tu GROQ_API_KEY para comenzar.");
            return;
        }

        setIsProcessing(true);
        setStatus("extracting");
        setProgress(5);

        try {
            setDetails("Leyendo estructura del PDF...");
            const arrayBuffer = await file.arrayBuffer();
            const doc = await extractPdfContent(arrayBuffer);

            setStatus("translating");
            setProgress(15);

            // 1. Atomic Chunking (2,000 chars)
            const chunks = chunkText(doc.content, 2000);
            const total = chunks.length;
            let finalTranslation = ""; // Atomic Accumulator

            setDetails(`Iniciando traducción de ${total} fragmentos atómicos...`);

            // 2. Sequential Loop with Retry Policy (v6.0.0)
            let i = 1;
            for (const chunk of chunks) {
                let success = false;
                let attempts = 0;
                let translated = "";

                while (!success && attempts < 3) {
                    try {
                        setDetails(`Traduciendo bloque ${i} de ${total} (Intento ${attempts + 1}/3)...`);
                        translated = await translateWithGroqClient(chunk, targetLang, apiKey);
                        success = true;
                    } catch (err: any) {
                        attempts++;
                        console.warn(`[SRE] Fallo en bloque ${i}, reintentando (${attempts}/3)...`, err.message);
                        if (attempts >= 3) throw new Error(`Fallo persistente en bloque ${i} tras 3 intentos.`);
                        await new Promise(r => setTimeout(r, 1000 * attempts)); // Backoff simple
                    }
                }

                finalTranslation += translated + "\n\n";

                const p = 15 + (i / total) * 75;
                setProgress(p);

                if (i < total) await new Promise(r => setTimeout(r, 600));
                i++;
            }

            // 3. Deferred Export (Ensamblado final)
            setStatus("exporting");
            setDetails("Ensamblando documento final con CSS de Rescate...");

            const result = await processTranslation(
                finalTranslation,
                "auto",
                targetLang,
                file.name.replace(".pdf", ""),
                exportFormat
            );

            if (result.success && result.fileData) {
                const binaryString = window.atob(result.fileData);
                const bytes = new Uint8Array(binaryString.length);
                for (let k = 0; k < binaryString.length; k++) {
                    bytes[k] = binaryString.charCodeAt(k);
                }

                const mimeType = exportFormat === "epub" ? "application/epub+zip" : "application/pdf";
                const blob = new Blob([bytes], { type: mimeType });

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${result.title}.${exportFormat}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                setStatus("done");
                setProgress(100);
                setDetails("¡Documento procesado con éxito!");
            } else {
                throw new Error(result.error || "Fallo en la exportación");
            }
        } catch (error: any) {
            console.error(error);
            setStatus("error");
            setDetails(error.message || "Error fatal en el procesamiento.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            {!file ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-4 border-dashed border-indigo-100 dark:border-zinc-800 p-12 rounded-3xl text-center cursor-pointer hover:border-indigo-500 transition-all bg-white dark:bg-zinc-900 group"
                >
                    <Upload className="w-16 h-16 mx-auto text-indigo-200 group-hover:text-indigo-500 mb-4 transition-colors" />
                    <p className="text-xl font-bold text-slate-700 dark:text-slate-200">Arrastra o haz clic para subir tu libro (PDF)</p>
                    <p className="text-slate-400 text-sm mt-2">Optimizado para archivos de hasta 30MB</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="application/pdf" />
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 rounded-xl text-white">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white leading-tight">{file.name}</h3>
                                <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <CheckCircle2 className="text-emerald-500" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Idioma de Destino</label>
                            <select
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                            >
                                <option value="es">Español</option>
                                <option value="en">Inglés</option>
                                <option value="fr">Francés</option>
                                <option value="de">Alemán</option>
                                <option value="it">Italiano</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Formato de Salida</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setExportFormat("epub")}
                                    className={`flex-1 py-3 rounded-xl font-black transition-all ${exportFormat === "epub" ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-100 text-slate-400"}`}
                                >
                                    EPUB
                                </button>
                                <button
                                    onClick={() => setExportFormat("pdf")}
                                    className={`flex-1 py-3 rounded-xl font-black transition-all ${exportFormat === "pdf" ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-100 text-slate-400"}`}
                                >
                                    PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Groq API Key (Dev Mode)</label>
                        <input
                            type="password"
                            placeholder="gsk_..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 font-mono text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    {status !== "idle" && (
                        <div className="space-y-3 p-6 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-between items-center">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${status === 'error' ? 'text-red-500' : 'text-indigo-600'}`}>
                                    {status === 'extracting' ? 'Analizando PDF' :
                                        status === 'translating' ? 'Traduciendo LPU' :
                                            status === 'exporting' ? 'Generando Archivo' :
                                                status === 'done' ? 'Completado' : 'Error'}
                                </span>
                                <span className="font-mono text-xs font-bold">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-3 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${status === 'error' ? 'bg-red-500' : 'bg-indigo-600'}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 font-medium italic">{details}</p>
                        </div>
                    )}

                    {status === "done" ? (
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                            <Sparkles size={20} />
                            Traducir otro archivo
                        </button>
                    ) : (
                        <button
                            onClick={startPipeline}
                            disabled={isProcessing}
                            className="w-full py-4 bg-indigo-600 disabled:bg-slate-200 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                            {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                            {isProcessing ? "Procesando Batch 5.0..." : "Empezar Traducción"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
