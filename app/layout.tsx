import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "TRADUCTOR PDF PRO",
    description: "Plataforma de traducción de documentos con IA",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
