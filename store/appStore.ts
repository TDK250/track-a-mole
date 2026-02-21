import { create } from 'zustand';

export interface AppState {
    gender: 'male' | 'female';
    setGender: (gender: 'male' | 'female') => void;
    selectedMoleId: number | null;
    setSelectedMoleId: (id: number | null) => void;
    isAddingMole: boolean;
    setIsAddingMole: (isAdding: boolean) => void;
    tempMolePosition: [number, number, number] | null;
    setTempMolePosition: (pos: [number, number, number] | null) => void;
    tempMoleNormal: [number, number, number] | null;
    setTempMoleNormal: (normal: [number, number, number] | null) => void;
    tempMoleCount: number | 'several';
    setTempMoleCount: (count: number | 'several') => void;
    tempMoleSpread: number;
    setTempMoleSpread: (spread: number) => void;

    // Smart Reminder Settings
    smartRemindersEnabled: boolean;
    setSmartRemindersEnabled: (enabled: boolean) => void;

    // Camera Control
    cameraResetTrigger: number;
    triggerCameraReset: () => void;

    // UI State
    isMenuOpen: boolean;
    setIsMenuOpen: (open: boolean) => void;

    // Model Geometry
    modelCenter: [number, number, number];
    modelHeight: number;
    setModelGeometry: (center: [number, number, number], height: number) => void;

    // Menu State
    menuHeight: number;
    setMenuHeight: (height: number) => void;

    // Sorting State
    sortMode: 'updated' | 'label';
    sortDirection: 'asc' | 'desc';
    setSortMode: (mode: 'updated' | 'label') => void;
    setSortDirection: (direction: 'asc' | 'desc') => void;

    // Tutorial State
    showTutorial: boolean;
    setShowTutorial: (show: boolean) => void;
    hasCompletedTutorial: boolean;
    completeTutorial: () => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    accentColor: string;
    setAccentColor: (color: string) => void;
    filterCondition: string | 'all';
    setFilterCondition: (condition: string | 'all') => void;

    // Screenshot State
    screenshotQueue: number[];
    addToScreenshotQueue: (ids: number[]) => void;
    popScreenshotQueue: () => void;
    screenshotMap: Record<number, string>;
    saveScreenshot: (id: number, dataUrl: string) => void;
    clearScreenshots: () => void;
}

export const useAppStore = create<AppState>((set) => {
    // Load from localStorage if available
    const isClient = typeof window !== 'undefined';
    const savedGender = isClient ? localStorage.getItem('gender-value') as 'male' | 'female' | null : null;
    const savedSmartReminders = isClient ? localStorage.getItem('smart-reminders-enabled') === 'true' : false; // Default false
    const hasCompletedTutorial = isClient ? localStorage.getItem('tutorial-completed') === 'true' : false;
    const savedSortMode = isClient ? localStorage.getItem('sort-mode') as 'updated' | 'label' | null : null;
    const savedSortDirection = isClient ? localStorage.getItem('sort-direction') as 'asc' | 'desc' | null : null;
    const savedTheme = isClient ? localStorage.getItem('app-theme') as 'light' | 'dark' | 'system' | null : null;
    const savedAccentColor = isClient ? localStorage.getItem('app-accent-color') : null;

    return {
        gender: savedGender || 'male',
        setGender: (gender) => {
            set({ gender });
            if (isClient) localStorage.setItem('gender-value', gender);
        },
        selectedMoleId: null,
        setSelectedMoleId: (id) => set((s) => ({ selectedMoleId: id, isMenuOpen: id ? true : s.isMenuOpen })),
        isAddingMole: false,
        setIsAddingMole: (isAdding) => set((s) => ({ isAddingMole: isAdding, isMenuOpen: isAdding ? true : s.isMenuOpen })),
        tempMolePosition: null,
        setTempMolePosition: (pos) => set({ tempMolePosition: pos }),
        tempMoleNormal: null,
        setTempMoleNormal: (normal) => set({ tempMoleNormal: normal }),
        tempMoleCount: 1,
        setTempMoleCount: (count) => set({ tempMoleCount: count }),
        tempMoleSpread: 2.0,
        setTempMoleSpread: (spread) => set({ tempMoleSpread: spread }),

        // Smart Reminders
        smartRemindersEnabled: savedSmartReminders,
        setSmartRemindersEnabled: (enabled) => {
            set({ smartRemindersEnabled: enabled });
            if (isClient) localStorage.setItem('smart-reminders-enabled', String(enabled));
        },

        // Camera Control
        cameraResetTrigger: 0,
        triggerCameraReset: () => set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),

        // UI State
        isMenuOpen: true, // Default to open
        setIsMenuOpen: (open) => set({ isMenuOpen: open }),

        // Model Geometry
        modelCenter: [0, 1.0, 0],
        modelHeight: 1.5,
        setModelGeometry: (center, height) => set({ modelCenter: center, modelHeight: height }),

        // Menu State
        menuHeight: 80, // Default closed height (approx)
        setMenuHeight: (height) => set({ menuHeight: height }),

        // Tutorial
        showTutorial: !hasCompletedTutorial,
        setShowTutorial: (show) => set({ showTutorial: show }),
        hasCompletedTutorial: hasCompletedTutorial,
        completeTutorial: () => {
            set({ showTutorial: false, hasCompletedTutorial: true });
            if (isClient) localStorage.setItem('tutorial-completed', 'true');
        },

        // Sorting
        sortMode: savedSortMode || 'updated',
        sortDirection: savedSortDirection || 'desc',
        setSortMode: (mode) => {
            set({ sortMode: mode });
            if (isClient) localStorage.setItem('sort-mode', mode);
        },
        setSortDirection: (direction) => {
            set({ sortDirection: direction });
            if (isClient) localStorage.setItem('sort-direction', direction);
        },
        // Theme
        theme: (savedTheme === 'system' ? 'light' : savedTheme) || 'light',
        setTheme: (theme) => {
            set({ theme });
            if (isClient) localStorage.setItem('app-theme', theme);
        },
        accentColor: savedAccentColor || '#3b82f6',
        setAccentColor: (color) => {
            set({ accentColor: color });
            if (isClient) {
                localStorage.setItem('app-accent-color', color);
                document.documentElement.style.setProperty('--accent-color', color);
            }
        },
        filterCondition: 'all',
        setFilterCondition: (condition) => set({ filterCondition: condition }),

        // Screenshot State
        screenshotQueue: [],
        addToScreenshotQueue: (ids) => set((state) => ({ screenshotQueue: [...state.screenshotQueue, ...ids] })),
        popScreenshotQueue: () => set((state) => ({ screenshotQueue: state.screenshotQueue.slice(1) })),
        screenshotMap: {},
        saveScreenshot: (id, dataUrl) => set((state) => ({ screenshotMap: { ...state.screenshotMap, [id]: dataUrl } })),
        clearScreenshots: () => set({ screenshotQueue: [], screenshotMap: {} }),
    };
});
