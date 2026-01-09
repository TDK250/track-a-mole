import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWARegistration from "@/components/PWARegistration";
import AppLock from "@/components/AppLock";

const inter = Inter({ subsets: ["latin"] });

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
    title: "Track-A-Mole",
    description: "Track and monitor your skin health in 3D",
    icons: {
        icon: `${basePath}/icon.png`,
        apple: `${basePath}/apple-touch-icon.png`,
    }
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased overflow-hidden`} suppressHydrationWarning>
                <PWARegistration />
                <AppLock>
                    {children}
                </AppLock>
            </body>
        </html>
    );
}
