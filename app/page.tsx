"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import BatchTranslator from "@/components/BatchTranslator";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950 font-sans">
            <div className="max-w-4xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-block p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-2">
                        <Sparkles className="text-indigo-600" size={32} />
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-slate-100 uppercase">
                        Traductor <span className="text-indigo-600 underline decoration-indigo-200">PDF PRO 5.0</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-wide">
                        Arquitectura Client-Side LPU para libros de hasta 30MB
                    </p>
                </div>

                <ErrorBoundary>
                    <BatchTranslator />
                </ErrorBoundary>

                <div className="text-center opacity-20 text-[10px] font-mono mt-12">
                    ENGINE_VERSION: 5.0.0-CLIENT-LPU (SRE_ISOLATED)
                </div>
            </div>
        </main>
    );
}
