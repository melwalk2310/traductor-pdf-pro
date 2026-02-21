"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Download, Languages, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { processTranslation, extractTextAction, translateChunkAction } from "./actions";
import { chunkText } from "@/lib/text-utils";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const LANGUAGES = [
    { code: "es", name: "Español" },
    { code: "en", name: "Inglés" },
    { code: "fr", name: "Francés" },
    { code: "de", name: "Alemán" },
    { code: "it", name: "Italiano" },
    { code: "pt", name: "Portugués" },
    { code: "zh", name: "Chino" },
    { code: "ja", name: "Japonés" },
];

export default function LandingPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [exportFormat, setExportFormat] = useState<"pdf" | "epub">("epub");
    const [sourceLang, setSourceLang] = useState("detect");
    const [targetLang, setTargetLang] = useState("es");
    const [status, setStatus] = useState<"idle" | "uploading" | "translating" | "exporting" | "done" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
            setStatus("idle");
        }
    };

    const handleTranslate = async () => {
        if (!file) return;

        setIsProcessing(true);
        setStatus("uploading");
        setProgress(5);

        try {
            // 1. Convertir archivo a Base64 para enviarlo al servidor
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = () => resolve((reader.result as string).split(",")[1]);
                reader.readAsDataURL(file);
            });
            const base64File = await base64Promise;

            // 2. Extraer texto en el Servidor (SRE Secure Extraction)
            const extractionResult = await extractTextAction(base64File);
            if (!extractionResult.success || !extractionResult.content) {
                throw new Error(extractionResult.error || "Fallo en la extracción de texto");
            }

            setStatus("translating");
            setProgress(15);

            // 3. Pipeline de Lote 4.0.1 (Frontend Orchestration)
            const chunks = chunkText(extractionResult.content, 4000);
            const totalChunks = chunks.length;
            const results: string[] = [];

            let i = 1;
            for (const chunk of chunks) {
                setErrorMessage(`Traduciendo bloque ${i} de ${totalChunks}...`);

                const chunkResult = await translateChunkAction(chunk, targetLang);
                if (!chunkResult.success || !chunkResult.translated) {
                    throw new Error(chunkResult.error || `Error en bloque ${i}`);
                }

                results.push(chunkResult.translated);

                const p = 15 + (i / totalChunks) * 75;
                setProgress(p);

                // Delay SRE para evitar Rate Limits
                if (i < totalChunks) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                i++;
            }

            const fullBookTranslation = results.join("\n\n");

            // 4. Exportación Robusta
            setStatus("exporting");
            setProgress(95);

            const result = await processTranslation(
                fullBookTranslation,
                sourceLang,
                targetLang,
                file.name.replace(".pdf", ""),
                exportFormat
            );

            if (result.success && result.fileData) {
                setProgress(100);
                const binaryString = window.atob(result.fileData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const mimeType = exportFormat === "epub" ? "application/epub+zip" : "application/pdf";
                const blob = new Blob([bytes], { type: mimeType });

                if (blob.size < 100) throw new Error("Archivo generado inválido (muy pequeño).");

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${result.title}.${exportFormat}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                setStatus("done");
                setErrorMessage(null);
            } else {
                setErrorMessage(result.error || "Error en la exportación");
                setStatus("error");
            }
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || "Error fatal en la aplicación");
            setStatus("error");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950 font-sans">
            <div className="max-w-4xl w-full space-y-8">
                {/* Header Simplified for brevity */}
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-slate-100 uppercase">
                        Traductor <span className="text-indigo-600">PDF PRO 4.0</span>
                    </h1>
                    <p className="text-slate-500">Pipeline de Lote con Resiliencia SRE</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl">
                    {!file ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 p-16 rounded-2xl text-center cursor-pointer hover:border-indigo-500 transition-colors"
                        >
                            <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                            <p className="font-bold text-slate-600">Haz clic para cargar PDF</p>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="application/pdf" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <FileText className="text-indigo-600" />
                                    <span className="font-bold">{file.name}</span>
                                </div>
                                <select
                                    value={targetLang}
                                    onChange={(e) => setTargetLang(e.target.value)}
                                    className="bg-white border rounded px-2 py-1 text-sm"
                                >
                                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => setExportFormat("epub")} className={cn("flex-1 py-2 rounded-lg font-bold border", exportFormat === "epub" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600")}>EPUB</button>
                                <button onClick={() => setExportFormat("pdf")} className={cn("flex-1 py-2 rounded-lg font-bold border", exportFormat === "pdf" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600")}>PDF</button>
                            </div>

                            {status !== "idle" && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                        <span>{status}</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
                                    </div>
                                    {errorMessage && <p className="text-center text-xs text-indigo-600 font-medium animate-pulse">{errorMessage}</p>}
                                </div>
                            )}

                            {status === "done" ? (
                                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-center font-bold">¡Traducido y Descargado!</div>
                            ) : status === "error" ? (
                                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-center font-bold">{errorMessage}</div>
                            ) : (
                                <button
                                    onClick={handleTranslate}
                                    disabled={isProcessing}
                                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                                    Comenzar Batch 4.0
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="text-center opacity-20 text-[10px] font-mono">
                    ASSET_VERSION: 4.0.4-BATCH (SRE_BUNDLER_STABLE)
                </div>
            </div>
        </main>
    );
}
