"use client";

import { useAppStore } from "@/store/appStore";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronRight, Camera, Move, MousePointerClick, ArrowUp } from "lucide-react";
import { useEffect } from "react";

export default function TutorialOverlay() {
    const { tutorialStep, setTutorialStep, completeTutorial, isMenuOpen, setIsMenuOpen } = useAppStore();

    // Auto-advance logic for specific steps or setup
    useEffect(() => {
        if (tutorialStep === 4 && !isMenuOpen) {
            // If we are on the menu step, ensure menu is visible-ish or guide user to open it
            // For now, let's just make sure it's closed so they can drag it up? 
            // Actually, if it's open, they can't drag it up. Let's force close it for the demo?
            setIsMenuOpen(false);
        }
    }, [tutorialStep, setIsMenuOpen, isMenuOpen]);

    if (tutorialStep === 0) return null;

    const nextStep = () => {
        if (tutorialStep >= 4) { // 4 steps
            completeTutorial();
        } else {
            setTutorialStep(tutorialStep + 1);
        }
    };

    const skipTutorial = () => {
        completeTutorial();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center"
            >
                {/* Backdrop with cutout effect (simplified as dimmed background for now) */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={nextStep} />

                {/* Content Container */}
                <div className="relative z-60 w-full max-w-sm px-6 pointer-events-none">
                    <motion.div
                        key={tutorialStep}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl pointer-events-auto"
                    >
                        {/* Step Content */}
                        <div className="flex flex-col items-center text-center space-y-4">
                            {tutorialStep === 1 && (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-2">
                                        <span className="text-3xl">👋</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Welcome to Track-A-Mole</h3>
                                    <p className="text-slate-300 leading-relaxed">
                                        Your personal companion for tracking skin health. Let's take a quick tour of how to use the app.
                                    </p>
                                </>
                            )}

                            {tutorialStep === 2 && (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-2 text-blue-400">
                                        <Move className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Interactive 3D Model</h3>
                                    <p className="text-slate-300 leading-relaxed">
                                        Drag to rotatethe model. Pinch to zoom in for a closer look.
                                    </p>
                                    <div className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full">
                                        Try it out now!
                                    </div>
                                </>
                            )}

                            {tutorialStep === 3 && (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 text-emerald-400">
                                        <MousePointerClick className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Logging a Mole</h3>
                                    <p className="text-slate-300 leading-relaxed">
                                        Tap anywhere on the body model to place a mole, or use the <span className="text-rose-400 font-bold">+ New Mole</span> button below.
                                    </p>
                                </>
                            )}

                            {tutorialStep === 4 && (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-2 text-purple-400">
                                        <ArrowUp className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Your Mole List</h3>
                                    <p className="text-slate-300 leading-relaxed mb-4">
                                        The bottom menu holds your list.
                                        <br />
                                        <span className="font-bold text-white">Drag it up</span> to view details, or <span className="font-bold text-white">drag down</span> to see the full model.
                                    </p>
                                </>
                            )}

                            {/* Controls */}
                            <div className="flex items-center gap-3 w-full pt-4">
                                <button
                                    onClick={skipTutorial}
                                    className="flex-1 py-3 px-4 rounded-xl text-slate-400 hover:bg-white/5 transition-colors text-sm font-medium"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="flex-[2] py-3 px-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    {tutorialStep === 4 ? "Get Started" : "Next"}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Step Indicator */}
                            <div className="flex gap-1.5 pt-2">
                                {[1, 2, 3, 4].map((step) => (
                                    <div
                                        key={step}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${step === tutorialStep ? "w-6 bg-white" : "w-1.5 bg-white/20"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
