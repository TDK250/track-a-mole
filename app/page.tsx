"use client";

import ThreeScene from "@/components/ThreeScene";
import UIOverlay from "@/components/UIOverlay";
import { useAppStore, type AppState } from "@/store/appStore";

export default function Home() {
    const isMenuOpen = useAppStore((state: AppState) => state.isMenuOpen);

    return (
        <main className="relative w-screen h-screen overflow-hidden">
            {/* 3D Background */}
            <ThreeScene />

            {/* UI Controls */}
            <UIOverlay />

            {/* Disclaimer Modal (Simplest Version) */}
            <div className="fixed bottom-2 right-2 text-[10px] text-slate-600 pointer-events-none uppercase tracking-widest">
                Not for Medical Diagnosis
            </div>
        </main>
    );
}
