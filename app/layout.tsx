import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWARegistration from "@/components/PWARegistration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Holy Moley - Mole Tracker",
    description: "Track and monitor your skin health in 3D",
    icons: {
        icon: "/Icon/bitmap.png",
        apple: "/Icon/bitmap.png",
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
        <html lang="en" className="dark">
            <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased overflow-hidden`}>
                <PWARegistration />
                {children}
            </body>
        </html>
    );
}
