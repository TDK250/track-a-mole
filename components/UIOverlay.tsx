"use client";

import { useAppStore, type AppState } from "@/store/appStore";
import {
    Camera, Calendar, MapPin, Search, ChevronRight, Plus, X,
    Trash2, Edit3, Settings, Shield, Lock, Unlock, Download, Upload, RefreshCw,
    Check, ArrowUpDown, SortAsc, SortDesc, ArrowLeftRight, Bell, ShieldCheck,
    AlertTriangle, Eye, EyeOff, Info, Delete, Star
} from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { haptics } from "@/utils/haptics";

const ABCDE_ITEMS = [
    { letter: 'A', title: 'Asymmetry', desc: 'One half of the mole does not match the other half.' },
    { letter: 'B', title: 'Border', desc: 'The edges are irregular, ragged, notched, or blurred.' },
    { letter: 'C', title: 'Color', desc: 'The color is not the same all over and may include shades of brown/black.' },
    { letter: 'D', title: 'Diameter', desc: 'The spot is larger than 6mm (about the size of a pencil eraser).' },
    { letter: 'E', title: 'Evolving', desc: 'The mole is changing in size, shape, or color over time.' }
];

import { useState, useEffect, useRef, useMemo } from "react";
import { NotificationService } from "@/services/notificationService";
import { ImportExportService } from "@/services/importExportService";
import { motion, useMotionValue, useTransform, PanInfo, useAnimation } from "framer-motion";
import TutorialOverlay from "./TutorialOverlay";

export default function UIOverlay() {
    const gender = useAppStore((s) => s.gender);
    const isAddingMole = useAppStore((s) => s.isAddingMole);
    const selectedMoleId = useAppStore((s) => s.selectedMoleId);
    const isMenuOpen = useAppStore((s) => s.isMenuOpen);
    const setIsMenuOpen = useAppStore((s) => s.setIsMenuOpen);
    const setMenuHeight = useAppStore((s) => s.setMenuHeight);
    const smartRemindersEnabled = useAppStore((s) => s.smartRemindersEnabled);
    const tempMolePosition = useAppStore((s) => s.tempMolePosition);
    const tempMoleNormal = useAppStore((s) => s.tempMoleNormal);

    // Actions - using getState to avoid subscription where possible or just destructuring stable actions
    const setGender = useAppStore((s) => s.setGender);
    const setIsAddingMole = useAppStore((s) => s.setIsAddingMole);
    const setSelectedMoleId = useAppStore((s) => s.setSelectedMoleId);
    const setTempMolePosition = useAppStore((s) => s.setTempMolePosition);
    const setTempMoleNormal = useAppStore((s) => s.setTempMoleNormal);
    const triggerCameraReset = useAppStore((s) => s.triggerCameraReset);
    const setSmartRemindersEnabled = useAppStore((s) => s.setSmartRemindersEnabled);
    const hasCompletedTutorial = useAppStore((s) => s.tutorialStep === 0 && typeof window !== 'undefined' && localStorage.getItem('tutorial-completed') === 'true');
    const tutorialStep = useAppStore((s) => s.tutorialStep);
    const setTutorialStep = useAppStore((s) => s.setTutorialStep);

    // Moles data (moved to lower declaration with filter)
    const [newLabel, setNewLabel] = useState("");
    const [showSettings, setShowSettings] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showAddEntry, setShowAddEntry] = useState(false);
    const sortMode = useAppStore((s) => s.sortMode);
    const sortDirection = useAppStore((s) => s.sortDirection);
    const setSortMode = useAppStore((s) => s.setSortMode);
    const setSortDirection = useAppStore((s) => s.setSortDirection);
    const [filterStarred, setFilterStarred] = useState(false);

    // Security & Data State
    const [showSecurity, setShowSecurity] = useState(false);
    const [showExportWindow, setShowExportWindow] = useState(false);
    const [showImportWindow, setShowImportWindow] = useState(false);
    const [exportPassword, setExportPassword] = useState("");
    const [importPassword, setImportPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tutorial initialization guard
    const tutorialInitializedRef = useRef(false);

    // App Lock State
    const [hasPin, setHasPin] = useState(false);
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [pinFlow, setPinFlow] = useState<'setup' | 'change' | 'remove'>('setup');
    const [pinStep, setPinStep] = useState<'enter' | 'confirm' | 'current'>('enter');
    const [pinInput, setPinInput] = useState("");
    const [tempPin, setTempPin] = useState("");
    const [pinError, setPinError] = useState(false);

    // Detailed Entry Form State
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [entrySize, setEntrySize] = useState("");
    const [entryTexture, setEntryTexture] = useState("");
    const [entryNotes, setEntryNotes] = useState("");
    const [entryABCDE, setEntryABCDE] = useState<Set<string>>(new Set());
    const [entryPhoto, setEntryPhoto] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
    const [editingMoleId, setEditingMoleId] = useState<number | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [moleToDelete, setMoleToDelete] = useState<number | null>(null);
    const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [expandedMoleId, setExpandedMoleId] = useState<number | null>(null);
    const [comparisonImageUrl, setComparisonImageUrl] = useState<string | null>(null);
    const [abcdeChecked, setAbcdeChecked] = useState<Set<string>>(new Set());

    const moles = useLiveQuery(() => db.moles.where('gender').equals(gender).toArray(), [gender]);
    const allEntries = useLiveQuery(() => db.entries.toArray()) || [];

    const sortedMoles = useMemo(() => {
        if (!moles) return [];

        let filtered = [...moles];
        if (filterStarred) {
            filtered = filtered.filter(m => m.starred);
        }

        const sorted = filtered.map(mole => {
            const moleEntries = allEntries.filter(e => e.moleId === mole.id);
            const lastUpdated = moleEntries.length > 0
                ? Math.max(...moleEntries.map(e => new Date(e.date).getTime()))
                : mole.createdAt;
            return { ...mole, lastUpdated };
        });

        sorted.sort((a, b) => {
            if (sortMode === 'label') {
                return sortDirection === 'asc'
                    ? a.label.localeCompare(b.label)
                    : b.label.localeCompare(a.label);
            } else {
                return sortDirection === 'asc'
                    ? a.lastUpdated - b.lastUpdated
                    : b.lastUpdated - a.lastUpdated;
            }
        });

        return sorted;
    }, [moles, allEntries, sortMode, sortDirection, filterStarred]);

    // Check if this is first launch
    useEffect(() => {
        const hasSelectedGender = localStorage.getItem('gender-selected');
        const savedGender = localStorage.getItem('gender-value');
        if (hasSelectedGender && savedGender) {
            setGender(savedGender as 'male' | 'female');
        } else {
            // First time load
            setShowOnboarding(true);
        }

        // Check for App Lock
        const savedPin = localStorage.getItem('app-lock-pin');
        setHasPin(!!savedPin);
    }, []); // Run once on mount

    // Handle tutorial start - consolidated into single effect with guard
    useEffect(() => {
        const tutorialDone = localStorage.getItem('tutorial-completed');
        const hasSelectedGender = localStorage.getItem('gender-selected');

        // Only start tutorial if:
        // 1. Tutorial hasn't been completed
        // 2. Gender has been selected (not in onboarding)
        // 3. Onboarding is closed
        // 4. We haven't already initialized the tutorial
        if (!tutorialDone && hasSelectedGender && !showOnboarding && !tutorialInitializedRef.current) {
            tutorialInitializedRef.current = true;
            setTutorialStep(1);
        }
    }, [showOnboarding]); // Only re-run when showOnboarding changes

    // Handle Notification Scheduling
    useEffect(() => {
        if (!smartRemindersEnabled) {
            NotificationService.cancelAll();
            return;
        }

        const schedule = async () => {
            const hasPermission = await NotificationService.checkPermissions();
            if (!hasPermission) {
                const granted = await NotificationService.requestPermissions();
                if (!granted) {
                    setSmartRemindersEnabled(false);
                    return;
                }
            }
            // Smart schedule: find neglected moles
            // We need to pass moles and entries, but hooks in useEffect is tricky if we don't have them all.
            // For simplicity, we'll let the service handle fetching or just trigger it periodically.
            // Better: Trigger the service to check DB directly.
            await NotificationService.scheduleSmartReminder();
        };

        schedule();
    }, [smartRemindersEnabled, setSmartRemindersEnabled]);

    const handleExport = async () => {
        const pass = exportPassword ? exportPassword.trim() : undefined;
        await ImportExportService.exportData(pass);
        setShowExportWindow(false);
        setExportPassword("");
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.name.endsWith('.tam')) {
            setShowImportWindow(true);
            // We'll wait for password submission in the modal
        } else {
            if (confirm("Importing data will replace all your current mole records. Continue?")) {
                try {
                    await ImportExportService.importData(file);
                    alert("Data imported successfully!");
                } catch (e) {
                    alert("Import failed. Ensure the file is a valid Track-A-Mole backup.");
                }
            }
        }
    };

    const handlePasswordImport = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;

        try {
            await ImportExportService.importData(file, importPassword.trim());
            alert("Data imported successfully!");
            setShowImportWindow(false);
            setImportPassword("");
        } catch (e) {
            alert("Import failed. Incorrect password or corrupted file.");
        }
    };

    const handleSelectGender = (selectedGender: 'male' | 'female') => {
        setGender(selectedGender);
        localStorage.setItem('gender-selected', 'true');
        localStorage.setItem('gender-value', selectedGender);
        setShowOnboarding(false);
        // Tutorial will start automatically via useEffect when showOnboarding becomes false
    };

    const handleResetData = async () => {
        await db.moles.clear();
        await db.entries.clear();
        localStorage.removeItem('gender-selected');
        localStorage.removeItem('app-lock-pin');
        setShowResetConfirm(false);
        setShowSettings(false);
        setShowOnboarding(true);
        setGender('male'); // Reset to default state
    };

    const handleAddMole = async () => {
        if (!tempMolePosition || !newLabel) return;
        try {
            const tempMoleNormal = useAppStore.getState().tempMoleNormal;
            await haptics.selection();
            const id = await db.moles.add({
                label: newLabel,
                gender,
                position: tempMolePosition,
                normal: tempMoleNormal || undefined,
                createdAt: Date.now()
            });
            console.log("Mole added with ID:", id);

            // Reset state
            setTempMolePosition(null);
            setTempMoleNormal(null);
            setNewLabel("");
            setIsAddingMole(false);

            // Re-select the newly created mole immediately to show detail view
            setSelectedMoleId(id as number);
            await haptics.success();

        } catch (error) {
            console.error("Failed to add mole:", error);
            await haptics.error();
        }
    };

    const resetEntryForm = () => {
        setEntryDate(new Date().toISOString().split('T')[0]);
        setEntrySize("");
        setEntryTexture("");
        setEntryNotes("");
        setEntryABCDE(new Set());
        setEntryPhoto(null);
        setEditingEntryId(null);
    };

    const handleToggleStar = async (id: number, currentStarred: boolean) => {
        try {
            await haptics.selection();
            await db.moles.update(id, { starred: !currentStarred });
        } catch (error) {
            console.error("Failed to toggle star:", error);
        }
    };

    const handleEntryPhotoUpload = async (source: CameraSource = CameraSource.Prompt) => {
        try {
            const image = await CapCamera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.DataUrl,
                source: source
            });

            if (image.dataUrl) {
                setEntryPhoto(image.dataUrl);
            }
        } catch (error) {
            console.error("Camera error:", error);
            // Fallback for web if needed or if user cancels
        }
    };

    const handleDeleteMole = (id: number) => {
        haptics.medium();
        setMoleToDelete(id);
    };

    const confirmDeleteMole = async () => {
        if (!moleToDelete) return;
        try {
            await haptics.selection();
            await db.moles.delete(moleToDelete);
            await db.entries.where('moleId').equals(moleToDelete).delete();
            setSelectedMoleId(null);
            setMoleToDelete(null);
            await haptics.success();
        } catch (error) {
            console.error("Failed to delete mole:", error);
            setMoleToDelete(null);
            await haptics.error();
        }
    };

    const handleUpdateMoleLabel = async (id: number) => {
        if (!editLabel) return;
        try {
            await db.moles.update(id, { label: editLabel });
            setEditingMoleId(null);
            setEditLabel("");
        } catch (error) {
            console.error("Failed to update mole:", error);
        }
    };

    const handleDeleteEntry = (id: number) => {
        haptics.medium();
        setEntryToDelete(id);
    };

    const confirmDeleteEntry = async () => {
        if (!entryToDelete) return;
        try {
            await haptics.selection();
            await db.entries.delete(entryToDelete);
            setEntryToDelete(null);
            await haptics.success();
        } catch (error) {
            console.error("Failed to delete entry:", error);
            setEntryToDelete(null);
            await haptics.error();
        }
    };

    const startEditEntry = (entry: any) => {
        setEditingEntryId(entry.id);
        setEntryDate(new Date(entry.date).toISOString().split('T')[0]);
        setEntrySize(entry.size.toString());
        setEntryTexture(entry.texture || "");
        setEntryNotes(entry.notes || "");
        setEntryABCDE(new Set(entry.abcde || []));
        setEntryPhoto(entry.photo || null);
        setShowAddEntry(true);
    };

    const handleSaveEntry = async () => {
        if (!selectedMoleId) return;

        const entryData = {
            moleId: selectedMoleId,
            date: new Date(entryDate).getTime(),
            size: Math.max(0, parseFloat(entrySize) || 0),
            texture: entryTexture,
            notes: entryNotes,
            abcde: Array.from(entryABCDE),
            photo: entryPhoto || undefined
        };

        try {
            await haptics.selection();
            if (editingEntryId) {
                await db.entries.update(editingEntryId, entryData);
            } else {
                await db.entries.add(entryData);
            }

            resetEntryForm();
            setShowAddEntry(false);
            await haptics.success();
        } catch (error) {
            console.error("Failed to save entry:", error);
            setShowAddEntry(false);
            await haptics.error();
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-10">
            {/* Onboarding Modal */}
            {showOnboarding && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md pointer-events-auto z-50 flex items-center justify-center p-4">
                    <div className="glass rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-white/10 animate-fade-in">
                        <h2 className="text-3xl font-bold mb-3 text-white">Welcome</h2>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Select your body type to get started. This will be your base model for tracking.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleSelectGender('female')}
                                className="bg-slate-800 hover:bg-rose-500 hover:border-rose-400 border-2 border-slate-700 text-white py-6 rounded-2xl font-bold transition-all flex flex-col items-center gap-2 group"
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform">👩</span>
                                Female
                            </button>
                            <button
                                onClick={() => handleSelectGender('male')}
                                className="bg-slate-800 hover:bg-blue-500 hover:border-blue-400 border-2 border-slate-700 text-white py-6 rounded-2xl font-bold transition-all flex flex-col items-center gap-2 group"
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform">👨</span>
                                Male
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Entry Modal */}
            {showAddEntry && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto z-50 flex items-center justify-center p-4">
                    <div className="glass rounded-3xl p-6 max-w-md w-full shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingEntryId ? 'Update Check-up' : 'New Check-up'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddEntry(false);
                                    resetEntryForm();
                                }}
                                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6 pr-2 -mr-2">
                            {/* Photo Documentation */}
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Photo Documentation</p>

                                {entryPhoto ? (
                                    <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-slate-800/30">
                                        <img src={entryPhoto} alt="Mole preview" className="w-full aspect-video object-cover" />
                                        <button
                                            onClick={() => setEntryPhoto(null)}
                                            className="absolute top-3 right-3 p-2 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors backdrop-blur-sm shadow-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleEntryPhotoUpload(CameraSource.Camera)}
                                            className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-rose-500/30 transition-all group/cam"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 mb-3 group-hover/cam:scale-110 transition-transform">
                                                <Camera className="w-6 h-6" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Camera</span>
                                        </button>
                                        <button
                                            onClick={() => handleEntryPhotoUpload(CameraSource.Photos)}
                                            className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all group/gal"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover/gal:scale-110 transition-transform">
                                                <MapPin className="w-6 h-6 rotate-45" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Gallery</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Date */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Date</p>
                                    <input
                                        type="date"
                                        value={entryDate}
                                        onChange={(e) => setEntryDate(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                    />
                                </div>
                                {/* Size */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Size (mm)</p>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 5"
                                        value={entrySize}
                                        onChange={(e) => setEntrySize(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                    />
                                </div>
                            </div>

                            {/* Texture */}
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Texture / Appearance</p>
                                <input
                                    type="text"
                                    placeholder="e.g. Smooth, Raised, Rough..."
                                    value={entryTexture}
                                    onChange={(e) => setEntryTexture(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                />
                            </div>

                            {/* ABCDE Checklist - Inline Diagnostic Tool */}
                            <div className="space-y-3 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ABCDE Check</p>
                                        <div className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-slate-500">
                                            {entryABCDE.size} / 5
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {ABCDE_ITEMS.map((item) => {
                                        const isChecked = entryABCDE.has(item.letter);
                                        return (
                                            <button
                                                key={item.letter}
                                                onClick={() => {
                                                    const newSet = new Set(entryABCDE);
                                                    if (isChecked) newSet.delete(item.letter);
                                                    else newSet.add(item.letter);
                                                    setEntryABCDE(newSet);
                                                }}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isChecked
                                                    ? 'bg-rose-500/10 border-rose-500/30'
                                                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 pr-2">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 transition-colors ${isChecked ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-900 text-slate-500'
                                                        }`}>
                                                        {isChecked ? <Check className="w-4 h-4" /> : item.letter}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={`text-sm font-bold ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                                                            {item.title}
                                                        </p>
                                                        <p className={`text-[10px] leading-tight mt-0.5 ${isChecked ? 'text-rose-200/70' : 'text-slate-500'}`}>
                                                            {item.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isChecked && (
                                                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                                                        Positive
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Notes</p>
                                <textarea
                                    placeholder="Add any specific observations..."
                                    rows={3}
                                    value={entryNotes}
                                    onChange={(e) => setEntryNotes(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
                                ></textarea>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveEntry}
                            className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20 mt-6 active:scale-[0.98]"
                        >
                            {editingEntryId ? 'Update Entry' : 'Save Entry'}
                        </button>
                    </div>
                </div>
            )}

            {/* Settings Panel */}
            {showSettings && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto z-40 flex items-end sm:items-center justify-center px-4 pb-12 pt-4 fade-in"
                    onClick={() => !showResetConfirm && setShowSettings(false)}
                >
                    <div
                        className="glass rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-700/50 bg-slate-900/90 flex flex-col max-h-[90vh] animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {!showResetConfirm ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="flex items-center justify-between mb-6 shrink-0">
                                    <h2 className="text-xl font-bold text-white">Settings</h2>
                                    <button onClick={() => setShowSettings(false)} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4 overflow-y-auto pr-2 -mr-2 pb-2">
                                    {/* Reminders Section */}
                                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Bell className="w-4 h-4 text-rose-400" />
                                                <div className="flex flex-col">
                                                    <p className="font-bold text-white tracking-wide">Smart Reminders</p>
                                                    <p className="text-[10px] text-slate-400">Notify if inactive for 30 days</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={smartRemindersEnabled}
                                                    onChange={(e) => setSmartRemindersEnabled(e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* App Lock Section */}
                                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Lock className="w-4 h-4 text-rose-400" />
                                                <div className="flex flex-col">
                                                    <p className="font-bold text-white tracking-wide">App Lock</p>
                                                    <p className="text-[10px] text-slate-400">Require PIN to open app</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={hasPin}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setPinFlow('setup');
                                                            setPinStep('enter');
                                                            setPinInput("");
                                                            setTempPin("");
                                                            setShowPinSetup(true);
                                                        } else {
                                                            setPinFlow('remove');
                                                            setPinStep('enter');
                                                            setPinInput("");
                                                            setShowPinSetup(true);
                                                        }
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                                            </label>
                                        </div>
                                        {hasPin && (
                                            <button
                                                onClick={() => {
                                                    setPinFlow('change');
                                                    setPinStep('current');
                                                    setPinInput("");
                                                    setShowPinSetup(true);
                                                }}
                                                className="w-full text-xs text-rose-400 font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 py-2 rounded-lg transition-colors border border-slate-700"
                                            >
                                                Change PIN
                                            </button>
                                        )}
                                    </div>

                                    {/* Security & Data Section */}
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => { setShowSecurity(true); }}
                                            className="w-full p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                                <span className="text-sm font-bold text-white tracking-wide">Security & Privacy</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                                        </button>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setShowExportWindow(true)}
                                                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 py-4"
                                            >
                                                <Download className="w-4 h-4 text-blue-400" />
                                                <span className="text-xs font-bold text-white uppercase tracking-wider">Export</span>
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 py-4"
                                            >
                                                <Upload className="w-4 h-4 text-purple-400" />
                                                <span className="text-xs font-bold text-white uppercase tracking-wider">Import</span>
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept=".json,.tam"
                                                onChange={handleImportFile}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowResetConfirm(true)}
                                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 group"
                                    >
                                        <AlertTriangle className="w-4 h-4 group-hover:animate-pulse" />
                                        Reset All Data
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
                                        <AlertTriangle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h2 className="text-xl font-bold mb-2 text-white">Are you sure?</h2>
                                    <p className="text-slate-400 text-sm">
                                        This will permanently delete all your tracked moles, photos, and history. You won't be able to undo this.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowResetConfirm(false)}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleResetData}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-red-500/20"
                                    >
                                        Yes, Reset
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Security Explanation Modal */}
            {showSecurity && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-auto z-[70] flex items-end sm:items-center justify-center px-4 pb-12 pt-4">
                    <div
                        className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                Privacy Policy
                            </h2>
                            <button
                                onClick={() => setShowSecurity(false)}
                                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6 text-slate-300 pr-2 -mr-2">
                            <section>
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-400">1</div>
                                    Local-Only Storage
                                </h3>
                                <p className="text-sm leading-relaxed">
                                    All your data, including mole locations and photos, is stored exclusively on your device using IndexedDB.
                                    Each application runs in an isolated "sandbox," meaning other apps cannot access your Track-A-Mole database.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-400">2</div>
                                    No Cloud Sync
                                </h3>
                                <p className="text-sm leading-relaxed">
                                    Track-A-Mole has no backend server and requires no account. Your health data never leaves your device,
                                    eliminating the risk of a server-side data breach.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-400">3</div>
                                    Open & Verifiable
                                </h3>
                                <p className="text-sm leading-relaxed">
                                    The entire app is Open Source (GPL v3). You can inspect the source code to confirm there are no tracking scripts,
                                    and monitor network traffic to verify that zero data is transmitted while you use the app.
                                </p>
                            </section>

                            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 items-start gap-3 flex flex-col">
                                <div className="flex gap-2">
                                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-400 leading-normal">
                                        Since there is no cloud backup, your data is lost if you lose your device or clear your browser data.
                                        Use the <strong>Export</strong> feature in settings to create your own secure backups.
                                    </p>
                                </div>
                                <div className="w-full h-px bg-white/5 my-1" />
                                <div className="flex gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-400 leading-normal">
                                        <strong>Disclaimer</strong>: This app is provided "as is" without warranty of any kind. The developers are not responsible for any data loss or medical decisions made based on this app.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Password Modal */}
            {showExportWindow && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto z-[70] flex items-end sm:items-center justify-center px-4 pb-12 pt-4">
                    <div className="glass border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
                        <h2 className="text-xl font-bold text-white mb-2">Secure Export</h2>
                        <p className="text-slate-400 text-sm mb-6">
                            Create an encrypted backup. If you set a password, you will need it to restore your data.
                        </p>

                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Optional Password"
                                    value={exportPassword}
                                    onChange={(e) => setExportPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500"
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowExportWindow(false)}
                                    className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    {exportPassword ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Password Modal */}
            {showImportWindow && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto z-[70] flex items-end sm:items-center justify-center px-4 pb-12 pt-4">
                    <div className="glass border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
                        <h2 className="text-xl font-bold text-white mb-2">Restoring Data</h2>
                        <p className="text-slate-400 text-sm mb-6">
                            This encrypted backup requires a password to decrypt.
                        </p>

                        <div className="space-y-4">
                            <input
                                type="password"
                                placeholder="Enter backup password"
                                value={importPassword}
                                onChange={(e) => setImportPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500"
                                autoFocus
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowImportWindow(false); setImportPassword(""); }}
                                    className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePasswordImport}
                                    className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold"
                                >
                                    Decrypt & Restore
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mole Deletion Confirmation */}
            {
                moleToDelete && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-auto z-[80] flex items-center justify-center p-4">
                        <div
                            className="bg-slate-900 border border-red-500/20 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 text-white">Delete Mole?</h2>
                            <p className="text-slate-400 text-sm mb-8">
                                This will permanently delete this mole and all its check-up history. This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setMoleToDelete(null)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteMole}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-red-500/20"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Entry Deletion Confirmation */}
            {
                entryToDelete && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-auto z-[80] flex items-center justify-center p-4">
                        <div
                            className="bg-slate-900 border border-red-500/20 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 text-white">Remove Entry?</h2>
                            <p className="text-slate-400 text-sm mb-8">
                                Are you sure you want to remove this check-up record?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEntryToDelete(null)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteEntry}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-red-500/20"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }



            {/* PIN Setup Modal */}
            {
                showPinSetup && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md pointer-events-auto z-[80] flex items-end sm:items-center justify-center px-4 pb-12 pt-4">
                        <div className="w-full max-w-xs flex flex-col items-center animate-slide-up">
                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-6 text-white">
                                <Lock className="w-8 h-8" />
                            </div>

                            <h2 className="text-xl font-bold text-white mb-2">
                                {pinFlow === 'setup' && pinStep === 'enter' && "Create PIN"}
                                {pinFlow === 'setup' && pinStep === 'confirm' && "Confirm PIN"}
                                {pinFlow === 'remove' && "Enter Current PIN"}
                                {pinFlow === 'change' && pinStep === 'current' && "Enter Old PIN"}
                                {pinFlow === 'change' && pinStep === 'enter' && "Enter New PIN"}
                                {pinFlow === 'change' && pinStep === 'confirm' && "Confirm New PIN"}
                            </h2>
                            <p className="text-slate-400 mb-8 text-sm text-center">
                                {pinError ? <span className="text-red-500 font-bold">Incorrect PIN. Try again.</span> :
                                    (pinStep === 'confirm' ? "Re-enter to confirm" : "Enter a 4-digit code")}
                            </p>

                            <div className="flex gap-4 mb-8">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className={`w-4 h-4 rounded-full transition-all ${i < pinInput.length ? 'bg-rose-500' : 'bg-slate-800'}`} />
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-4 w-full mb-8">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => {
                                            if (pinInput.length < 4) {
                                                const newPin = pinInput + num;
                                                setPinInput(newPin);
                                                setPinError(false);

                                                if (newPin.length === 4) {
                                                    const stored = localStorage.getItem('app-lock-pin');

                                                    // SETUP FLOW
                                                    if (pinFlow === 'setup') {
                                                        if (pinStep === 'enter') {
                                                            setTempPin(newPin);
                                                            setPinInput("");
                                                            setPinStep('confirm');
                                                        } else if (pinStep === 'confirm') {
                                                            if (newPin === tempPin) {
                                                                localStorage.setItem('app-lock-pin', newPin);
                                                                setHasPin(true);
                                                                setShowPinSetup(false);
                                                                haptics.success();
                                                            } else {
                                                                setPinError(true);
                                                                setPinInput("");
                                                                setPinStep('enter');
                                                                setTempPin("");
                                                            }
                                                        }
                                                    }
                                                    // REMOVE FLOW
                                                    else if (pinFlow === 'remove') {
                                                        if (newPin === stored) {
                                                            localStorage.removeItem('app-lock-pin');
                                                            setHasPin(false);
                                                            setShowPinSetup(false);
                                                            haptics.success();
                                                        } else {
                                                            setPinError(true);
                                                            setPinInput("");
                                                            haptics.error();
                                                        }
                                                    }
                                                    // CHANGE FLOW
                                                    else if (pinFlow === 'change') {
                                                        if (pinStep === 'current') {
                                                            if (newPin === stored) {
                                                                setPinInput("");
                                                                setPinStep('enter');
                                                            } else {
                                                                setPinError(true);
                                                                setPinInput("");
                                                                haptics.error();
                                                            }
                                                        } else if (pinStep === 'enter') {
                                                            setTempPin(newPin);
                                                            setPinInput("");
                                                            setPinStep('confirm');
                                                        } else if (pinStep === 'confirm') {
                                                            if (newPin === tempPin) {
                                                                localStorage.setItem('app-lock-pin', newPin);
                                                                setShowPinSetup(false);
                                                                haptics.success();
                                                            } else {
                                                                setPinError(true);
                                                                setPinInput("");
                                                                setPinStep('enter');
                                                                setTempPin("");
                                                                haptics.error();
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                        className={`aspect-square rounded-full bg-slate-900 border border-slate-800 text-white text-xl font-bold hover:bg-slate-800 active:bg-rose-500 active:border-rose-500 transition-all ${num === 0 ? 'col-start-2' : ''}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                                <div className="col-start-3 row-start-4 flex justify-center items-center">
                                    <button
                                        onClick={() => setPinInput(prev => prev.slice(0, -1))}
                                        className="p-4 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                                    >
                                        <Delete className="w-6 h-6" />
                                        {/* Actually I used X or Trash2 before. Let's use X for backspace or check if Delete is proper lucide icon. Lucide has Delete. */}
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPinSetup(false)}
                                className="text-slate-500 hover:text-white text-sm font-bold uppercase tracking-wider px-4 py-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Top Bar */}
            <div
                className="absolute top-0 left-0 right-0 p-4 pointer-events-auto z-30"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-rose-500 text-2xl">●</span>
                        <span className="tracking-tight">Track-A-Mole</span>
                    </h1>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                haptics.selection();
                                triggerCameraReset();
                            }}
                            className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                            title="Recenter Camera"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>


            {/* Main Content Area - Bottom Sheet */}
            <TutorialOverlay />
            <DraggableBottomSheet
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                isAddingMole={isAddingMole}
                selectedMoleId={selectedMoleId}
                handleAddMole={handleAddMole}
                newLabel={newLabel}
                setNewLabel={setNewLabel}
                moles={sortedMoles}
                sortMode={sortMode}
                sortDirection={sortDirection}
                setSortMode={setSortMode}
                setSortDirection={setSortDirection}
                handleDeleteMole={handleDeleteMole}
                handleUpdateMoleLabel={handleUpdateMoleLabel}
                handleDeleteEntry={handleDeleteEntry}
                startEditEntry={startEditEntry}
                editingMoleId={editingMoleId}
                setEditingMoleId={setEditingMoleId}
                editLabel={editLabel}
                setEditLabel={setEditLabel}
                setShowAddEntry={setShowAddEntry}
                resetEntryForm={resetEntryForm}
                setMenuHeight={setMenuHeight}
                onExpandImage={(url: string, moleId: number) => {
                    setSelectedImageUrl(url);
                    setExpandedMoleId(moleId);
                }}
                filterStarred={filterStarred}
                setFilterStarred={setFilterStarred}
                handleToggleStar={handleToggleStar}
            />

            {/* Expanded Image View */}
            {
                selectedImageUrl && (
                    <ImageOverlay
                        selectedImageUrl={selectedImageUrl}
                        expandedMoleId={expandedMoleId}
                        comparisonImageUrl={comparisonImageUrl}
                        setComparisonImageUrl={setComparisonImageUrl}
                        onClose={() => {
                            setSelectedImageUrl(null);
                            setComparisonImageUrl(null);
                            setExpandedMoleId(null);
                        }}
                    />
                )
            }
        </div >
    );
}

function DraggableBottomSheet({
    isMenuOpen, setIsMenuOpen, isAddingMole, selectedMoleId,
    handleAddMole, newLabel, setNewLabel, moles,
    sortMode, sortDirection, setSortMode, setSortDirection,
    handleDeleteMole, handleUpdateMoleLabel, handleDeleteEntry,
    startEditEntry, editingMoleId, setEditingMoleId, editLabel, setEditLabel,
    setShowAddEntry, resetEntryForm, setMenuHeight, onExpandImage,
    filterStarred, setFilterStarred, handleToggleStar
}: {
    // ... other props
    onExpandImage: (url: string, moleId: number) => void
} & any) {
    const controls = useAnimation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(500); // Approximate default
    const dragY = useMotionValue(0);

    // Use ResizeObserver for more reliable height tracking as panels switch
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const newHeight = entry.target.scrollHeight;
                if (newHeight > 0 && newHeight !== contentHeight) {
                    setContentHeight(newHeight);
                }
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [contentHeight]);

    // Handle open/close state changes driven by store
    useEffect(() => {
        const targetY = isMenuOpen ? 0 : contentHeight - 110;

        // Use a slight delay for contentHeight stabilization if needed, 
        // but spring animation handles most cases well.
        controls.start({
            y: targetY,
            transition: { type: "spring", stiffness: 350, damping: 35, restDelta: 0.1 }
        });

        const targetHeight = isMenuOpen ? contentHeight : 110;
        setMenuHeight(targetHeight);
    }, [isMenuOpen, controls, contentHeight, setMenuHeight]);

    // Sync menu height for 3D model centering
    useEffect(() => {
        const unsubscribe = dragY.on("change", (latestY) => {
            const visibleHeight = Math.max(80, contentHeight - latestY);
            setMenuHeight(visibleHeight);
        });
        return () => unsubscribe();
    }, [dragY, contentHeight, setMenuHeight]);

    const isDragDisabled = false;

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (isDragDisabled) return;
        const threshold = 50; // Much more responsive threshold
        const velocityThreshold = 100;

        let shouldOpen = isMenuOpen;
        if (info.offset.y > threshold || info.velocity.y > velocityThreshold) {
            shouldOpen = false;
        } else if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
            shouldOpen = true;
        }

        setIsMenuOpen(shouldOpen);
    };

    return (
        <motion.div
            ref={containerRef}
            drag={isDragDisabled ? false : "y"}
            dragConstraints={{ top: 0, bottom: contentHeight - 80 }}
            dragElastic={0.2}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            animate={controls}
            style={{ y: dragY }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-transparent pointer-events-auto"
        >
            <div
                className="w-full relative bg-transparent"
                style={{
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)',
                }}
            >
                <div className="max-w-xl mx-auto flex flex-col items-center px-4">
                    {/* Pull Handle Area - Enhanced target for easier dragging */}
                    <div className="w-full flex justify-center relative z-20 pt-10 cursor-grab active:cursor-grabbing pb-4 touch-none">
                        <div className="w-12 h-1.5 bg-white/30 rounded-full shadow-lg" />
                    </div>

                    <div className="w-full">
                        {isAddingMole ? (
                            <AddMolePanel
                                key="add"
                                onSave={handleAddMole}
                                label={newLabel}
                                setLabel={setNewLabel}
                            />
                        ) : selectedMoleId ? (
                            <MoleDetailPanel
                                key="detail"
                                onAddEntry={() => {
                                    resetEntryForm();
                                    setShowAddEntry(true);
                                }}
                                onDeleteMole={handleDeleteMole}
                                onUpdateLabel={handleUpdateMoleLabel}
                                onDeleteEntry={handleDeleteEntry}
                                onEditEntry={startEditEntry}
                                editingMoleId={editingMoleId}
                                setEditingMoleId={setEditingMoleId}
                                editLabel={editLabel}
                                setEditLabel={setEditLabel}
                                onExpandImage={onExpandImage}
                                handleToggleStar={handleToggleStar}
                            />
                        ) : (
                            <MoleListPanel
                                key="list"
                                moles={moles}
                                sortMode={sortMode}
                                sortDirection={sortDirection}
                                setSortMode={setSortMode}
                                setSortDirection={setSortDirection}
                                onExpandImage={onExpandImage}
                                filterStarred={filterStarred}
                                setFilterStarred={setFilterStarred}
                                handleToggleStar={handleToggleStar}
                            />
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function MoleListPanel({
    moles,
    sortMode,
    sortDirection,
    setSortMode,
    setSortDirection,
    onExpandImage,
    filterStarred,
    setFilterStarred,
    handleToggleStar
}: {
    moles: any[] | undefined,
    sortMode: 'updated' | 'label',
    sortDirection: 'asc' | 'desc',
    setSortMode: (m: 'updated' | 'label') => void,
    setSortDirection: (d: 'asc' | 'desc') => void,
    onExpandImage: (url: string, moleId: number) => void,
    filterStarred: boolean,
    setFilterStarred: (v: boolean) => void,
    handleToggleStar: (id: number, current: boolean) => void
}) {
    const setSelectedMoleId = useAppStore((s: AppState) => s.setSelectedMoleId);
    const tutorialStep = useAppStore((s: AppState) => s.tutorialStep);
    const [showSortMenu, setShowSortMenu] = useState(false);

    return (
        <div
            className="glass rounded-3xl p-6 max-h-[50vh] flex flex-col border border-white/10 shadow-2xl bg-slate-900/80 pointer-events-auto w-full"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white">Your Moles</h2>
                    <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-medium text-slate-400 border border-white/5">
                        {moles?.length || 0}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { haptics.selection(); setFilterStarred(!filterStarred); }}
                        className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${filterStarred ? 'glass bg-amber-500/20 border-amber-500/50 text-amber-500' : 'glass bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
                        title="Filter starred moles"
                    >
                        <Star className={`w-4 h-4 ${filterStarred ? 'fill-amber-500' : ''}`} />
                        <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Starred</span>
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${showSortMenu ? 'glass bg-rose-500/20 border-rose-500/50 text-rose-500' : 'glass bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
                            title="Sort moles"
                        >
                            <ArrowUpDown className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Sort</span>
                        </button>

                        {showSortMenu && (
                            <>
                                <div className="fixed inset-0 z-[100]" onClick={() => setShowSortMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 w-56 glass bg-slate-900/95 border border-white/10 rounded-2xl p-2 shadow-2xl z-[101] animate-fade-in">
                                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">
                                        Sort By
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (sortMode === 'updated') {
                                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                            } else {
                                                setSortMode('updated');
                                                setSortDirection('desc');
                                            }
                                            setShowSortMenu(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${sortMode === 'updated' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-300 hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span className="whitespace-nowrap">Recently Updated</span>
                                        </div>
                                        {sortMode === 'updated' && (
                                            sortDirection === 'asc' ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (sortMode === 'label') {
                                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                            } else {
                                                setSortMode('label');
                                                setSortDirection('asc');
                                            }
                                            setShowSortMenu(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${sortMode === 'label' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-300 hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Edit3 className="w-4 h-4" />
                                            <span className="whitespace-nowrap">Alphabetical</span>
                                        </div>
                                        {sortMode === 'label' && (
                                            sortDirection === 'asc' ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            useAppStore.getState().setIsAddingMole(true);
                            useAppStore.getState().setSelectedMoleId(null);
                        }}
                        className={`flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-rose-500/20 ${tutorialStep === 4 ? "animate-pulse ring-4 ring-rose-500/50 z-50 relative" : ""
                            }`}
                    >
                        <Plus className="w-4 h-4" />
                        New Mole
                    </button>
                </div>
            </div>

            {moles?.length === 0 ? (
                <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-300 font-medium mb-1">No moles tracked yet</p>
                    <p className="text-slate-500 text-sm">Tap the + button to start tracking</p>
                </div>
            ) : (
                <div className="overflow-y-auto -mx-2 px-2 space-y-2 pb-safe">
                    {moles?.map((mole: any) => (
                        <div
                            key={mole.id}
                            onClick={() => setSelectedMoleId(mole.id as number)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 transition-all group cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <MoleThumbnail moleId={mole.id!} onExpandImage={onExpandImage} />
                                <div className="text-left">
                                    <p className="font-semibold text-white">{mole.label}</p>
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(mole.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleStar(mole.id!, !!mole.starred);
                                    }}
                                    className={`p-2 rounded-full transition-colors ${mole.starred ? 'text-amber-500 bg-amber-500/10' : 'text-slate-600 hover:text-amber-500 hover:bg-amber-500/10'}`}
                                >
                                    <Star className={`w-4 h-4 ${mole.starred ? 'fill-amber-500' : ''}`} />
                                </button>
                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function MoleThumbnail({ moleId, onExpandImage }: { moleId: number, onExpandImage: (url: string, moleId: number) => void }) {
    const latestEntry = useLiveQuery(
        () => db.entries.where('moleId').equals(moleId).reverse().first(),
        [moleId]
    );

    if (latestEntry?.photo) {
        return (
            <div
                className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shadow-inner cursor-pointer active:scale-95 transition-transform"
                onClick={(e) => { e.stopPropagation(); onExpandImage(latestEntry.photo!, moleId); }}
            >
                <img src={latestEntry.photo} alt="Thumbnail" className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
            <MapPin className="w-5 h-5" />
        </div>
    );
}

function AddMolePanel({ onSave, label, setLabel }: { onSave: () => void, label: string, setLabel: (v: string) => void }) {
    const tempMolePosition = useAppStore((s: AppState) => s.tempMolePosition);
    const setIsAddingMole = useAppStore((s: AppState) => s.setIsAddingMole);
    const setTempMolePosition = useAppStore((s: AppState) => s.setTempMolePosition);

    return (
        <div
            className="glass rounded-3xl p-6 border border-rose-500/20 shadow-2xl bg-slate-900/90 pointer-events-auto w-full"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Track New Mole</h2>
                    <p className="text-xs text-rose-400 font-medium uppercase tracking-wide mt-1">Setup Mode</p>
                </div>
                <button
                    onClick={() => {
                        useAppStore.getState().setIsAddingMole(false);
                        useAppStore.getState().setTempMolePosition(null);
                        setLabel("");
                    }}
                    className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4 mb-6">
                {/* Step 1 */}
                <div className={`p-4 rounded-2xl border transition-all ${!tempMolePosition
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-slate-800/30 border-slate-700/50 opacity-50'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${!tempMolePosition ? 'bg-rose-500 text-white' : 'bg-green-500 text-white'
                            }`}>
                            {!tempMolePosition ? '1' : '✓'}
                        </div>
                        <div>
                            <p className="font-bold text-white">Tap Body</p>
                            <p className="text-sm text-slate-400">Locate the mole on the 3D model</p>
                        </div>
                    </div>
                </div>

                {/* Step 2 */}
                <div className={`p-4 rounded-2xl border transition-all ${tempMolePosition
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-slate-800/30 border-slate-700/50 opacity-50'
                    }`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${!label ? 'bg-slate-700 text-slate-400' : 'bg-rose-500 text-white'
                            }`}>
                            2
                        </div>
                        <div>
                            <p className="font-bold text-white">Label It</p>
                            <p className="text-sm text-slate-400">Give it a recognizable name</p>
                        </div>
                    </div>
                    {tempMolePosition && (
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onSave()}
                            placeholder="e.g., Right Shoulder"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500 transition-colors mt-2"
                            autoFocus
                        />
                    )}
                </div>
            </div>

            <button
                onClick={onSave}
                disabled={!tempMolePosition || !label}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-500 text-white py-4 rounded-xl font-bold transition-all disabled:cursor-not-allowed shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
            >
                <Check className="w-5 h-5" />
                Save Mole
            </button>
        </div>
    );
}

function MoleDetailPanel({
    onAddEntry,
    onDeleteMole,
    onUpdateLabel,
    onDeleteEntry,
    onEditEntry,
    editingMoleId,
    setEditingMoleId,
    editLabel,
    setEditLabel,
    onExpandImage,
    handleToggleStar
}: {
    onAddEntry: () => void,
    onDeleteMole: (id: number) => void,
    onUpdateLabel: (id: number) => void,
    onDeleteEntry: (id: number) => void,
    onEditEntry: (entry: any) => void,
    editingMoleId: number | null,
    setEditingMoleId: (id: number | null) => void,
    editLabel: string,
    setEditLabel: (s: string) => void,
    onExpandImage: (url: string, moleId: number) => void,
    handleToggleStar: (id: number, current: boolean) => void
}) {
    const selectedMoleId = useAppStore((s: AppState) => s.selectedMoleId);
    const setSelectedMoleId = useAppStore((s: AppState) => s.setSelectedMoleId);
    const setIsAddingMole = useAppStore((s: AppState) => s.setIsAddingMole);
    const mole = useLiveQuery(() => selectedMoleId ? db.moles.get(selectedMoleId) : undefined, [selectedMoleId]);
    const entries = useLiveQuery(() => selectedMoleId ? db.entries.where('moleId').equals(selectedMoleId).reverse().toArray() : [], [selectedMoleId]);

    const [lastMole, setLastMole] = useState<any>(null);

    useEffect(() => {
        if (mole) setLastMole(mole);
    }, [mole]);

    const activeMole = mole || lastMole;
    if (!activeMole) return null;

    return (
        <div
            className="glass rounded-3xl p-6 max-h-[70vh] flex flex-col border border-white/10 shadow-2xl bg-slate-900/90 pointer-events-auto w-full"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                    {editingMoleId === activeMole.id ? (
                        <div className="flex items-center gap-2">
                            <input
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="bg-slate-800 border-b border-rose-500 text-white font-bold outline-none px-1 w-full max-w-[150px]"
                                autoFocus
                            />
                            <button onClick={() => onUpdateLabel(activeMole.id!)} className="text-green-500 p-1">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingMoleId(null)} className="text-slate-500 p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-white">{activeMole.label}</h2>
                            <button
                                onClick={() => { setEditingMoleId(activeMole.id!); setEditLabel(activeMole.label); }}
                                className="p-1 text-slate-500 hover:text-white"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => handleToggleStar(activeMole.id!, !!activeMole.starred)}
                                className={`p-1 transition-colors ${activeMole.starred ? 'text-amber-500' : 'text-slate-500 hover:text-amber-500'}`}
                            >
                                <Star className={`w-4 h-4 ${activeMole.starred ? 'fill-amber-500' : ''}`} />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Since {new Date(activeMole.createdAt).toLocaleDateString()}
                        </p>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <p className="text-xs text-rose-400 font-bold">
                            {entries?.length || 0} checks
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onDeleteMole(activeMole.id!)}
                        className="p-2 text-slate-500 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors"
                        title="Delete Mole"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            setSelectedMoleId(null);
                            setIsAddingMole(false);
                            setEditingMoleId(null);
                        }}
                        className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 -mx-2 px-2">
                <button
                    onClick={onAddEntry}
                    className="w-full py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 group mb-2"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Record Check-up
                </button>

                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-inter">History</h3>
                    {entries?.length === 0 ? (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                            <p className="text-slate-400 text-sm">No check-ups recorded yet</p>
                        </div>
                    ) : (
                        entries?.map((entry: any) => (
                            <div key={entry.id} className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden group/entry relative">
                                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/entry:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={() => onEditEntry(entry)}
                                        className="p-2 bg-slate-900/80 text-white rounded-full hover:bg-blue-500/80 transition-colors backdrop-blur-sm shadow-lg"
                                    >
                                        <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => onDeleteEntry(entry.id!)}
                                        className="p-2 bg-slate-900/80 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors backdrop-blur-sm shadow-lg"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                                {entry.photo && (
                                    <div
                                        className="w-full aspect-video overflow-hidden cursor-pointer active:opacity-90 transition-opacity"
                                        onClick={() => onExpandImage(entry.photo!, activeMole.id!)}
                                    >
                                        <img
                                            src={entry.photo}
                                            alt="Mole photo"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="p-4 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-slate-500" />
                                            <span className="text-xs text-slate-400 font-inter">{new Date(entry.date).toLocaleDateString()}</span>

                                            {/* ABCDE Badges in History List */}
                                            {entry.abcde && entry.abcde.length > 0 && (
                                                <div className="flex gap-1 ml-2">
                                                    {entry.abcde.map((letter: string) => (
                                                        <div key={letter} className="w-4 h-4 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center text-[8px] font-black border border-rose-500/20">
                                                            {letter}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {entry.size > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20 font-inter">
                                                {entry.size}mm
                                            </span>
                                        )}
                                    </div>
                                    {entry.texture && (
                                        <div className="flex gap-2 items-center">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800 px-1.5 py-0.5 rounded font-inter">Texture:</span>
                                            <span className="text-xs text-slate-300 font-inter">{entry.texture}</span>
                                        </div>
                                    )}
                                    {entry.notes && (
                                        <p className="text-sm text-slate-200 leading-relaxed border-t border-white/5 pt-2 mt-2 font-inter">{entry.notes}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function ImageOverlay({
    selectedImageUrl,
    expandedMoleId,
    comparisonImageUrl,
    setComparisonImageUrl,
    onClose
}: {
    selectedImageUrl: string,
    expandedMoleId: number | null,
    comparisonImageUrl: string | null,
    setComparisonImageUrl: (url: string | null) => void,
    onClose: () => void
}) {
    const [showComparisonSelector, setShowComparisonSelector] = useState(false);
    const [showABCDEGuide, setShowABCDEGuide] = useState(false);

    const expandedMoleEntries = useLiveQuery(
        () => expandedMoleId ? db.entries.where('moleId').equals(expandedMoleId).toArray() : [],
        [expandedMoleId]
    ) || [];
    const otherEntries = expandedMoleEntries.filter(e => e.photo && e.photo !== selectedImageUrl);

    return (
        <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-4 animate-fade-in pointer-events-auto"
            onClick={onClose}
        >
            {/* Header Controls */}
            <div
                className="absolute left-6 right-6 flex justify-between items-center z-10"
                style={{ top: 'calc(env(safe-area-inset-top) + 2rem)' }}
            >
                <div className="flex items-center gap-2">
                    {otherEntries.length > 0 && (
                        <button
                            className={`glass px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2 ${showComparisonSelector ? 'bg-rose-500/20 border-rose-500/30 text-rose-500' : 'text-white hover:bg-white/5 border border-white/10'}`}
                            onClick={(e) => { e.stopPropagation(); setShowComparisonSelector(!showComparisonSelector); setShowABCDEGuide(false); }}
                        >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            {comparisonImageUrl ? 'Change' : 'Compare'}
                        </button>
                    )}
                    {comparisonImageUrl && (
                        <button
                            className="glass px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all text-slate-300 hover:text-white hover:bg-white/5 border border-white/10"
                            onClick={(e) => { e.stopPropagation(); setComparisonImageUrl(null); }}
                        >
                            Exit
                        </button>
                    )}
                    <button
                        className={`glass px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2 ${showABCDEGuide ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'text-white hover:bg-white/5 border border-white/10'}`}
                        onClick={(e) => { e.stopPropagation(); setShowABCDEGuide(!showABCDEGuide); setShowComparisonSelector(false); }}
                    >
                        <Info className="w-3.5 h-3.5" />
                        Guide
                    </button>
                </div>

                <button
                    className="glass w-11 h-11 rounded-full flex items-center justify-center text-white hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-white/10 shadow-xl"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Image(s) Container */}
            <div className={`w-full h-full flex flex-col md:flex-row items-center justify-center gap-6 pt-24 transition-all duration-500`}>
                <div className={`relative flex items-center justify-center transition-all duration-500 ${comparisonImageUrl ? 'w-full md:w-1/2 h-1/2 md:h-[80vh]' : 'w-full h-[85vh]'}`}>
                    <motion.img
                        layout
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        src={selectedImageUrl}
                        alt="Expanded mole"
                        className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border border-white/5"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Primary Labels Overlay */}
                    {comparisonImageUrl && (
                        <div className="absolute top-6 left-6 glass px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
                            Primary
                        </div>
                    )}
                </div>

                {comparisonImageUrl && (
                    <div className="w-full md:w-1/2 h-1/2 md:h-[80vh] relative flex items-center justify-center animate-scale-in">
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={comparisonImageUrl}
                            alt="Comparison mole"
                            className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border border-white/5"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute top-6 right-6">
                            <div className="bg-rose-500/90 glass backdrop-blur-3xl px-4 py-1.5 rounded-full border border-rose-500/30 text-[10px] font-bold text-white uppercase tracking-widest shadow-lg">
                                Comparison
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ABCDE Guide Overlay */}
            {showABCDEGuide && (
                <div
                    className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-12 pt-4 animate-fade-in pointer-events-auto"
                    onClick={() => setShowABCDEGuide(false)}
                >
                    <div
                        className="glass bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Info className="w-5 h-5 text-blue-400" />
                                </div>
                                ABCDE Guide
                            </h4>
                            <button
                                onClick={() => setShowABCDEGuide(false)}
                                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 font-inter text-left pr-2 -mr-2">
                            {ABCDE_ITEMS.map((item) => (
                                <div key={item.letter} className="flex gap-4 p-3 rounded-2xl bg-white/5 border border-transparent">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex flex-shrink-0 items-center justify-center text-xl font-black text-rose-500 shadow-inner">
                                        {item.letter}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{item.title}</p>
                                        <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}

                            <div className="pt-4 border-t border-white/5 font-inter">
                                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex gap-3 text-rose-200">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                    <p className="text-[10px] uppercase font-bold tracking-wider leading-relaxed">
                                        Self-checks are for tracking only. Consult a doctor for any new or changing spots.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowABCDEGuide(false)}
                            className="w-full py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all shadow-lg shadow-rose-500/20 mt-6 active:scale-[0.98] text-sm uppercase tracking-widest"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* Comparison Selector */}
            {showComparisonSelector && (
                <div
                    className="absolute bottom-12 left-4 right-4 md:left-12 md:right-12 animate-slide-up z-20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="glass bg-slate-900/80 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-3xl">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-white font-bold text-xs uppercase tracking-widest opacity-60">Compare with check-up from:</h4>
                            <button onClick={() => setShowComparisonSelector(false)} className="text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                            {otherEntries.map((entry) => (
                                <button
                                    key={entry.id}
                                    onClick={() => {
                                        setComparisonImageUrl(entry.photo!);
                                        setShowComparisonSelector(false);
                                    }}
                                    className="flex-shrink-0 group"
                                >
                                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-white/10 group-hover:border-rose-500/50 transition-all relative">
                                        <img src={entry.photo!} alt="Entry thumbnail" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Plus className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">
                                        {new Date(entry.date).toLocaleDateString()}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
