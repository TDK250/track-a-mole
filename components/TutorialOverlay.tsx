"use client";

import { useAppStore } from "@/store/appStore";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronRight, Camera, Move, MousePointerClick, ArrowUp, Hand, Pointer, FileText, MapPin } from "lucide-react";
import { useEffect } from "react";

export default function TutorialOverlay() {
    const { tutorialStep, setTutorialStep, completeTutorial, isMenuOpen, setIsMenuOpen, hasInteractedWithModel, isAddingMole, menuHeight, selectedMoleId, tempMolePosition } = useAppStore();

    // Reset interaction state when entering spin step (step 2)
    useEffect(() => {
        if (tutorialStep === 2) {
            useAppStore.getState().setHasInteractedWithModel(false);
        }
    }, [tutorialStep]);

    // Step 2: Advance when model is rotated
    useEffect(() => {
        if (tutorialStep === 2 && hasInteractedWithModel) {
            const timer = setTimeout(() => {
                setTutorialStep(3);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [tutorialStep, hasInteractedWithModel, setTutorialStep]);

    // Step 3: Advance when entering "Add Mole" mode
    useEffect(() => {
        if (tutorialStep === 3 && isAddingMole) {
            setTutorialStep(4);
        }
    }, [tutorialStep, isAddingMole, setTutorialStep]);

    // Step 4: Advance when user taps on body (tempMolePosition is set)
    useEffect(() => {
        if (tutorialStep === 4 && tempMolePosition !== null) {
            setTutorialStep(5);
        }
    }, [tutorialStep, tempMolePosition, setTutorialStep]);

    // Step 5: Advance when mole is saved (selectedMoleId is set after saving)
    useEffect(() => {
        if (tutorialStep === 5 && selectedMoleId !== null && !isAddingMole) {
            const timer = setTimeout(() => {
                setTutorialStep(6);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [tutorialStep, selectedMoleId, isAddingMole, setTutorialStep]);

    // Step 6: Complete tutorial after a brief display
    useEffect(() => {
        if (tutorialStep === 6) {
            const timer = setTimeout(() => {
                completeTutorial();
            }, 5000); // Give user 5 seconds to read the final step
            return () => clearTimeout(timer);
        }
    }, [tutorialStep, completeTutorial]);

    if (tutorialStep === 0) return null;

    const nextStep = () => {
        if (tutorialStep >= 6) {
            completeTutorial();
        } else {
            setTutorialStep(tutorialStep + 1);
        }
    };

    const skipTutorial = () => {
        completeTutorial();
    };

    const getPositionClass = () => {
        switch (tutorialStep) {
            case 1: return "items-center justify-end pb-32"; // Welcome: Bottom
            case 2: return "items-center justify-end pb-24"; // Spin: Bottom
            case 3: return "items-center justify-start pt-20"; // Add Mole Button (at bottom): Show at Top
            case 4: return "items-center justify-start pt-20"; // Tap Body: Show at Top
            case 5: return "items-center justify-start pt-20"; // Name Mole (form at bottom): Show at Top
            case 6: return "items-center justify-start pt-20"; // Record Checkup (menu at bottom): Show at Top
            default: return "items-center justify-end";
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`fixed inset-0 z-50 pointer-events-none flex flex-col ${getPositionClass()} transition-all duration-500`}
            >
                {/* Backdrop for step 1 (Welcome) */}
                {tutorialStep === 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                    />
                )}

                {/* Step 2 Visual Cue: Swipe Animation */}
                {tutorialStep === 2 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                            animate={{ x: [-60, 60] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", repeatType: "mirror" }}
                            className="text-white/80"
                        >
                            <Hand className="w-16 h-16 drop-shadow-lg" />
                        </motion.div>
                        <div className="absolute w-40 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full mt-12" />
                    </div>
                )}

                {/* Step 4 Visual Cue: Tap Animation */}
                {tutorialStep === 4 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="text-rose-400"
                        >
                            <MousePointerClick className="w-16 h-16 drop-shadow-lg" />
                        </motion.div>
                    </div>
                )}

                {/* Content Container */}
                <div className="relative z-60 w-full max-w-sm px-6 pointer-events-none mb-4">
                    <motion.div
                        key={tutorialStep}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl pointer-events-auto"
                    >
                        <div className="flex flex-col items-center text-center space-y-4">

                            {/* STEP 1: Welcome */}
                            {tutorialStep === 1 && (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-2">
                                        <span className="text-3xl">👋</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Welcome to Track-A-Mole</h3>
                                    <p className="text-slate-300 leading-relaxed">
                                        Your private, secure companion for tracking skin health over time.
                                    </p>
                                    <div className="flex items-center gap-3 w-full pt-4">
                                        <button onClick={skipTutorial} className="flex-1 py-3 px-4 rounded-xl text-slate-400 hover:bg-white/5 transition-colors text-sm font-medium">Skip</button>
                                        <button onClick={nextStep} className="flex-[2] py-3 px-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                                            Start Tour <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* STEP 2: Spin Model */}
                            {tutorialStep === 2 && (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-2 text-blue-400">
                                        <Move className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Give it a Spin</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        Drag on the screen to rotate the 3D model. Pinch to zoom in and out.
                                    </p>
                                    <div className="animate-pulse text-xs text-blue-400 font-bold uppercase tracking-wider mt-2">
                                        Waiting for interaction...
                                    </div>
                                </>
                            )}

                            {/* STEP 3: Click Add Mole Button */}
                            {tutorialStep === 3 && (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 text-emerald-400">
                                        <MousePointerClick className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Add Your First Mole</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        Tap the <span className="text-rose-400 font-bold whitespace-nowrap">+ New Mole</span> button below to start tracking a spot.
                                    </p>
                                </>
                            )}

                            {/* STEP 4: Tap on Body */}
                            {tutorialStep === 4 && (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-2 text-rose-400">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Tap on the Body</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        Click directly on the 3D model where your mole is located to place a marker.
                                    </p>
                                    <div className="animate-pulse text-xs text-rose-400 font-bold uppercase tracking-wider mt-2">
                                        Tap anywhere on the model...
                                    </div>
                                </>
                            )}

                            {/* STEP 5: Name Your Mole */}
                            {tutorialStep === 5 && (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-2 text-amber-400">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Name Your Mole</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        Give this mole a descriptive name (like "Left Shoulder" or "Back of Leg") and tap <span className="text-rose-400 font-bold">Add Mole</span>.
                                    </p>
                                    <div className="animate-pulse text-xs text-amber-400 font-bold uppercase tracking-wider mt-2">
                                        Fill in the form below...
                                    </div>
                                </>
                            )}

                            {/* STEP 6: Record Checkup */}
                            {tutorialStep === 6 && (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2 text-purple-400">
                                        <Camera className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Record Check-ups</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        Tap on any mole in your list, then click <span className="text-rose-400 font-bold whitespace-nowrap">+ New Check-up</span> to add photos, measurements, and track changes over time.
                                    </p>
                                </>
                            )}

                            {/* Step Indicator */}
                            {tutorialStep > 0 && (
                                <div className="flex gap-1.5 pt-2">
                                    {[1, 2, 3, 4, 5, 6].map((step) => (
                                        <div
                                            key={step}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${step === tutorialStep ? "w-6 bg-white" : "w-1.5 bg-white/20"
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
