"use client";

import { useState } from "react";
import { Upload, FileText, Download, Languages, Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function LandingPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [exportFormat, setExportFormat] = useState<"pdf" | "epub">("epub");

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === "application/pdf") {
            setFile(droppedFile);
        }
    };

    const handleTranslate = async () => {
        if (!file) return;
        setIsProcessing(true);
        // Simulación de pipeline
        setTimeout(() => {
            setIsProcessing(false);
            alert("Traducción completada (Demo Mode)");
        }, 3000);
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950">
            <div className="max-w-3xl w-full space-y-8 text-center">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        TRADUCTOR PDF PRO
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        Traducción semántica de alta fidelidad potenciada por Gemini 1.5 Flash.
                    </p>
                </div>

                <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={cn(
                        "relative group border-2 border-dashed rounded-2xl p-12 transition-all duration-200 ease-in-out",
                        file
                            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                            : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                    )}
                >
                    <div className="space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        </div>
                        {file ? (
                            <div className="space-y-1">
                                <p className="font-medium text-slate-900 dark:text-slate-100">{file.name}</p>
                                <p className="text-sm text-slate-500">Documento listo para procesar</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                                    Arrastra tu PDF aquí
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    o haz clic para seleccionar un archivo
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {file && (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-center gap-4">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Formato de salida:
                            </label>
                            <select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value as "pdf" | "epub")}
                                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="epub">EPUB (Recomendado)</option>
                                <option value="pdf">PDF (Original)</option>
                            </select>
                        </div>

                        <button
                            onClick={handleTranslate}
                            disabled={isProcessing}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando traducción...
                                </>
                            ) : (
                                <>
                                    <Languages className="w-5 h-5" />
                                    Traducir Documento
                                </>
                            )}
                        </button>
                    </div>
                )}

                <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: FileText, title: "Fidelidad", desc: "Mantiene el formato original" },
                        { icon: Languages, title: "Multilingüe", desc: "Soporte para +100 idiomas" },
                        { icon: Download, title: "EPUB/PDF", desc: "Múltiples formatos de salida" },
                    ].map((feature, i) => (
                        <div key={i} className="text-center space-y-2">
                            <feature.icon className="w-6 h-6 mx-auto text-indigo-500" />
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
