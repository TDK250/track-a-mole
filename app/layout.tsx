"use client";

import { useState, useEffect } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWARegistration from "@/components/PWARegistration";
import AppLock from "@/components/AppLock";
import DisclaimerScreen from "@/components/DisclaimerScreen";
import { useAppStore } from "@/store/appStore";

const inter = Inter({ subsets: ["latin"] });

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Move metadata to a separate file if needed for server-side SEO, 
// but for this SPA-like app, we'll favor the theme logic here for now.
// Since we used "use client", we can't export metadata from this file anymore in Next.js 13+
// I'll keep it commented out or move it to a client-safe way if possible, or just accept the trade-off.

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const theme = useAppStore((state) => state.theme);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme, mounted]);

    // Determine inline background color to prevent flash
    const bgColor = theme === 'dark' ? '#020617' : '#f8fafc';

    return (
        <html lang="en" className={theme} suppressHydrationWarning>
            <body
                className={`${inter.className} antialiased overflow-hidden transition-colors duration-300`}
                style={{ backgroundColor: bgColor }}
                suppressHydrationWarning
            >
                <PWARegistration />
                <DisclaimerScreen>
                    <AppLock>
                        {children}
                    </AppLock>
                </DisclaimerScreen>
            </body>
        </html>
    );
}
