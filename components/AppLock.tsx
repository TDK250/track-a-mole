"use client";

import { useState, useEffect } from 'react';
import { Lock, Unlock, Delete } from 'lucide-react';

export default function AppLock({ children }: { children: React.ReactNode }) {
    const [isLocked, setIsLocked] = useState(true);
    const [isChecking, setIsChecking] = useState(true);
    const [pin, setPin] = useState("");
    const [hasPin, setHasPin] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Check if PIN is set in localStorage
        const storedPin = localStorage.getItem('app-lock-pin');
        // Robust check: must be a string of exactly 4 digits
        if (storedPin && /^\d{4}$/.test(storedPin)) {
            setHasPin(true);
            setIsLocked(true);
        } else {
            // Clear invalid values if any
            if (storedPin) localStorage.removeItem('app-lock-pin');
            setHasPin(false);
            setIsLocked(false);
        }
        setIsChecking(false);
    }, []);

    const handleNumberClick = (num: number) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    useEffect(() => {
        if (pin.length === 4 && hasPin) {
            const storedPin = localStorage.getItem('app-lock-pin');
            // Simple comparison (assuming stored as plain text or simple hash for now)
            // Ideally we hash the input and compare. 
            // For MVP we will store plain text or base64. Let's assume stored is matching input (plain).
            // If we want obfuscation: storedPin === btoa(pin)

            // Let's deduce format from what we decide to store. 
            // I'll stick to direct comparison for simplicity in this step, 
            // or I can do a quick check.

            if (storedPin === pin) {
                setIsLocked(false);
                setPin("");
            } else {
                setError(true);
                setPin("");
                // Haptic feedback could go here
                if (navigator.vibrate) navigator.vibrate(200);
            }
        }
    }, [pin, hasPin]);

    if (isChecking) {
        return null; // Or a loading spinner if preferred, but null prevents flash
    }

    if (!isLocked) {
        return <>{children}</>;
    }

    return (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-xs flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 text-rose-500 animate-pulse">
                    <Lock className="w-8 h-8" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">App Locked</h1>
                <p className="text-slate-400 mb-8 text-sm">Enter your 4-digit PIN to access</p>

                {/* PIN Dots */}
                <div className="flex gap-4 mb-8">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full transition-all ${i < pin.length
                                ? (error ? 'bg-red-500' : 'bg-rose-500')
                                : 'bg-slate-800'
                                }`}
                        />
                    ))}
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-4 w-full mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className="aspect-square rounded-full bg-slate-900 border border-slate-800 text-white text-xl font-bold hover:bg-slate-800 active:bg-rose-500 active:border-rose-500 transition-all"
                        >
                            {num}
                        </button>
                    ))}
                    <div /> {/* Empty slot */}
                    <button
                        onClick={() => handleNumberClick(0)}
                        className="aspect-square rounded-full bg-slate-900 border border-slate-800 text-white text-xl font-bold hover:bg-slate-800 active:bg-rose-500 active:border-rose-500 transition-all"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="aspect-square rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                        <Delete className="w-6 h-6" />
                    </button>
                </div>

                {error && (
                    <p className="text-red-500 text-sm font-medium animate-bounce">Incorrect PIN</p>
                )}
            </div>
        </div>
    );
}
