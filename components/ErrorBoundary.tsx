"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h2 className="text-xl font-bold text-red-900">Algo salió mal</h2>
                    <p className="text-red-700 text-sm max-w-md mx-auto">
                        {this.state.error?.message || "Ocurrió un error inesperado durante el procesamiento."}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-full mx-auto hover:bg-red-700 transition-colors font-bold"
                    >
                        <RefreshCcw size={18} />
                        Reintentar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
