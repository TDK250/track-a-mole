"use client";

import { useState, useEffect } from 'react';
import { ShieldAlert, Check } from 'lucide-react';

export default function DisclaimerScreen({ children }: { children: React.ReactNode }) {
    const [hasAccepted, setHasAccepted] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [isChecked, setIsChecked] = useState(false);

    useEffect(() => {
        // Check if disclaimer has already been accepted
        const accepted = localStorage.getItem('disclaimer-accepted');
        if (accepted === 'true') {
            setHasAccepted(true);
        }
        setIsChecking(false);
    }, []);

    const handleAccept = () => {
        localStorage.setItem('disclaimer-accepted', 'true');
        setHasAccepted(true);
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(50);
    };

    // Don't render anything while checking localStorage to prevent flash
    if (isChecking) {
        return null;
    }

    // If already accepted, render children directly
    if (hasAccepted) {
        return <>{children}</>;
    }

    return (
        <div className="fixed inset-0 bg-slate-950 z-[200] flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="w-full max-w-md flex flex-col items-center">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 text-amber-500">
                    <ShieldAlert className="w-8 h-8" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white mb-2 text-center">
                    Important Disclaimer
                </h1>
                <p className="text-slate-400 mb-6 text-sm text-center">
                    Please read and accept before continuing
                </p>

                {/* Disclaimer Content */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-6 text-sm text-slate-300 space-y-4 max-h-[50vh] overflow-y-auto">
                    <p>
                        <strong className="text-white">Track-A-Mole</strong> is a personal tracking tool designed to help you monitor and document skin features over time. By using this application, you acknowledge and agree to the following:
                    </p>

                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <span className="text-amber-500 font-bold">1.</span>
                            <p>
                                <strong className="text-white">Not Medical Advice:</strong> This app is not a medical device and does not provide medical diagnosis, treatment recommendations, or professional health advice.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <span className="text-amber-500 font-bold">2.</span>
                            <p>
                                <strong className="text-white">Consult Professionals:</strong> Always seek the guidance of a qualified healthcare provider for any skin concerns. Do not delay seeking medical advice based on information from this app.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <span className="text-amber-500 font-bold">3.</span>
                            <p>
                                <strong className="text-white">User Responsibility:</strong> You are solely responsible for any health decisions you make. The creators of this app are not liable for any actions taken based on its use.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <span className="text-amber-500 font-bold">4.</span>
                            <p>
                                <strong className="text-white">No Warranty:</strong> This app is provided "as is" without warranties of any kind, express or implied. The creators disclaim all liability for any damages arising from use of this application.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Checkbox */}
                <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                    <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5
                            ${isChecked
                                ? 'bg-rose-500 border-rose-500'
                                : 'border-slate-600 group-hover:border-slate-500'
                            }`}
                        onClick={() => setIsChecked(!isChecked)}
                    >
                        {isChecked && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-slate-300 text-sm leading-relaxed">
                        I have read and understood this disclaimer. I agree that this app is for personal tracking only and is not a substitute for professional medical advice.
                    </span>
                </label>

                {/* Submit Button */}
                <button
                    onClick={handleAccept}
                    disabled={!isChecked}
                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all
                        ${isChecked
                            ? 'bg-rose-500 hover:bg-rose-600 active:scale-[0.98]'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    I Understand & Accept
                </button>
            </div>
        </div>
    );
}
