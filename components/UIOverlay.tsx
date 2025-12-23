"use client";

import { useAppStore, type AppState } from "@/store/appStore";
import { Plus, X, Check, MapPin, Calendar, ChevronRight, Settings, AlertTriangle, Camera, Trash2, Edit3 } from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function UIOverlay() {
    const { gender, setGender, isAddingMole, setIsAddingMole, selectedMoleId, setSelectedMoleId, tempMolePosition, setTempMolePosition } = useAppStore();
    const [newLabel, setNewLabel] = useState("");
    const [showSettings, setShowSettings] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showAddEntry, setShowAddEntry] = useState(false);

    // Detailed Entry Form State
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [entrySize, setEntrySize] = useState("");
    const [entryTexture, setEntryTexture] = useState("");
    const [entryNotes, setEntryNotes] = useState("");
    const [entryPhoto, setEntryPhoto] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
    const [editingMoleId, setEditingMoleId] = useState<number | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const moles = useLiveQuery(() => db.moles.where('gender').equals(gender).toArray(), [gender]);

    // Check if this is first launch
    useEffect(() => {
        const hasSelectedGender = localStorage.getItem('gender-selected');
        if (!hasSelectedGender) {
            setShowOnboarding(true);
        }
    }, []);

    const handleSelectGender = (selectedGender: 'male' | 'female') => {
        setGender(selectedGender);
        localStorage.setItem('gender-selected', 'true');
        localStorage.setItem('gender-value', selectedGender);
        setShowOnboarding(false);
    };

    const handleResetData = async () => {
        await db.moles.clear();
        await db.entries.clear();
        localStorage.removeItem('gender-selected');
        setShowResetConfirm(false);
        setShowSettings(false);
        setShowOnboarding(true);
        setGender('male'); // Reset to default state
    };

    const handleAddMole = async () => {
        if (!tempMolePosition || !newLabel) return;

        try {
            const id = await db.moles.add({
                label: newLabel,
                gender,
                position: tempMolePosition,
                createdAt: Date.now()
            });

            // Comprehensive state reset
            setTempMolePosition(null);
            setNewLabel("");
            setIsAddingMole(false);
            setSelectedMoleId(id as number);
        } catch (error) {
            console.error("Failed to add mole:", error);
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

    const handleDeleteMole = async (id: number) => {
        if (!confirm("Are you sure you want to delete this mole and all its entries?")) return;
        try {
            await db.moles.delete(id);
            await db.entries.where('moleId').equals(id).delete();
            setSelectedMoleId(null);
        } catch (error) {
            console.error("Failed to delete mole:", error);
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

    const handleDeleteEntry = async (id: number) => {
        if (!confirm("Delete this check-up entry?")) return;
        try {
            await db.entries.delete(id);
        } catch (error) {
            console.error("Failed to delete entry:", error);
        }
    };

    const startEditEntry = (entry: any) => {
        setEditingEntryId(entry.id);
        setEntryDate(new Date(entry.date).toISOString().split('T')[0]);
        setEntrySize(entry.size.toString());
        setEntryTexture(entry.texture || "");
        setEntryNotes(entry.notes || "");
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
            photo: entryPhoto || undefined
        };

        try {
            if (editingEntryId) {
                await db.entries.update(editingEntryId, entryData);
            } else {
                await db.entries.add(entryData);
            }

            // Reset form and close
            setEntrySize("");
            setEntryTexture("");
            setEntryNotes("");
            setEntryPhoto(null);
            setEditingEntryId(null);
            setShowAddEntry(false);
        } catch (error) {
            console.error("Failed to save entry:", error);
            setShowAddEntry(false);
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-10">
            {/* Onboarding Modal */}
            <AnimatePresence>
                {showOnboarding && (
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-md pointer-events-auto z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
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
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Entry Modal */}
            <AnimatePresence>
                {showAddEntry && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto z-50 flex items-end sm:items-center justify-center p-4">
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="glass rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    {editingEntryId ? 'Update Check-up' : 'New Check-up'}
                                </h2>
                                <button onClick={() => { setShowAddEntry(false); setEditingEntryId(null); }} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-6 pr-2 -mr-2">
                                {/* Photo Selection */}
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
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto z-40 flex items-center justify-center p-4"
                        onClick={() => !showResetConfirm && setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="glass rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-700/50 bg-slate-900/90"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!showResetConfirm ? (
                                <>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-white">Settings</h2>
                                        <button onClick={() => setShowSettings(false)} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Model</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{gender === 'male' ? '👨' : '👩'}</span>
                                                <p className="font-medium capitalize text-white">{gender}</p>
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
                                </>
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
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Top Bar */}
            <div
                className="absolute top-0 left-0 right-0 p-4 pointer-events-auto z-30"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-rose-500 text-2xl">●</span>
                        <span className="tracking-tight">HolyMoley</span>
                    </h1>

                    <button
                        onClick={() => setShowSettings(true)}
                        className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content Area - Bottom Sheet */}
            <div
                className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none z-20"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
            >
                <div className="max-w-xl mx-auto">
                    <AnimatePresence>
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
                                onAddEntry={() => setShowAddEntry(true)}
                                onDeleteMole={handleDeleteMole}
                                onUpdateLabel={handleUpdateMoleLabel}
                                onDeleteEntry={handleDeleteEntry}
                                onEditEntry={startEditEntry}
                                editingMoleId={editingMoleId}
                                setEditingMoleId={setEditingMoleId}
                                editLabel={editLabel}
                                setEditLabel={setEditLabel}
                            />
                        ) : (
                            <MoleListPanel key="list" moles={moles} />
                        )}
                    </AnimatePresence>
                </div>
            </div>


        </div>
    );
}

function MoleListPanel({ moles }: { moles: any[] | undefined }) {
    const setSelectedMoleId = useAppStore((s: AppState) => s.setSelectedMoleId);

    return (
        <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass rounded-3xl p-6 max-h-[50vh] flex flex-col border-t border-white/10 shadow-2xl bg-slate-900/80 pointer-events-auto"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white">Your Moles</h2>
                    <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-medium text-slate-400 border border-white/5">
                        {moles?.length || 0}
                    </span>
                </div>

                <button
                    onClick={() => {
                        useAppStore.getState().setIsAddingMole(true);
                        useAppStore.getState().setSelectedMoleId(null);
                    }}
                    className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                >
                    <Plus className="w-4 h-4" />
                    New Mole
                </button>
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
                        <button
                            key={mole.id}
                            onClick={() => setSelectedMoleId(mole.id as number)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <MoleThumbnail moleId={mole.id!} />
                                <div className="text-left">
                                    <p className="font-semibold text-white">{mole.label}</p>
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(mole.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400" />
                        </button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

function MoleThumbnail({ moleId }: { moleId: number }) {
    const latestEntry = useLiveQuery(
        () => db.entries.where('moleId').equals(moleId).reverse().first(),
        [moleId]
    );

    if (latestEntry?.photo) {
        return (
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shadow-inner">
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
        <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass rounded-3xl p-6 border-t border-rose-500/20 shadow-2xl bg-slate-900/90 pointer-events-auto"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Track New Mole</h2>
                    <p className="text-xs text-rose-400 font-medium uppercase tracking-wide mt-1">Setup Mode</p>
                </div>
                <button
                    onClick={() => {
                        setIsAddingMole(false);
                        setTempMolePosition(null);
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
        </motion.div>
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
    setEditLabel
}: {
    onAddEntry: () => void,
    onDeleteMole: (id: number) => void,
    onUpdateLabel: (id: number) => void,
    onDeleteEntry: (id: number) => void,
    onEditEntry: (entry: any) => void,
    editingMoleId: number | null,
    setEditingMoleId: (id: number | null) => void,
    editLabel: string,
    setEditLabel: (s: string) => void
}) {
    const selectedMoleId = useAppStore((s: AppState) => s.selectedMoleId);
    const setSelectedMoleId = useAppStore((s: AppState) => s.setSelectedMoleId);
    const setIsAddingMole = useAppStore((s: AppState) => s.setIsAddingMole);
    const mole = useLiveQuery(() => selectedMoleId ? db.moles.get(selectedMoleId) : undefined, [selectedMoleId]);
    const entries = useLiveQuery(() => selectedMoleId ? db.entries.where('moleId').equals(selectedMoleId).reverse().toArray() : [], [selectedMoleId]);

    if (!mole) return null;

    return (
        <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass rounded-3xl p-6 max-h-[70vh] flex flex-col border-t border-white/10 shadow-2xl bg-slate-900/90 pointer-events-auto"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                    {editingMoleId === mole.id ? (
                        <div className="flex items-center gap-2">
                            <input
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="bg-slate-800 border-b border-rose-500 text-white font-bold outline-none px-1 w-full max-w-[150px]"
                                autoFocus
                            />
                            <button onClick={() => onUpdateLabel(mole.id!)} className="text-green-500 p-1">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingMoleId(null)} className="text-slate-500 p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-white">{mole.label}</h2>
                            <button
                                onClick={() => { setEditingMoleId(mole.id!); setEditLabel(mole.label); }}
                                className="p-1 text-slate-500 hover:text-white"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Since {new Date(mole.createdAt).toLocaleDateString()}
                        </p>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <p className="text-xs text-rose-400 font-bold">
                            {entries?.length || 0} checks
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onDeleteMole(mole.id!)}
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
                                    <img
                                        src={entry.photo}
                                        alt="Mole photo"
                                        className="w-full aspect-video object-cover"
                                    />
                                )}
                                <div className="p-4 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-slate-500" />
                                            <span className="text-xs text-slate-400 font-inter">{new Date(entry.date).toLocaleDateString()}</span>
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
        </motion.div>
    );
}
