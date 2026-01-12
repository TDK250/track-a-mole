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

    // Tutorial State
    tutorialStep: number; // 0=none, 1=welcome, 2=camera, 3=add, 4=menu
    setTutorialStep: (step: number) => void;
    completeTutorial: () => void;
}

export const useAppStore = create<AppState>((set) => {
    // Load from localStorage if available
    const isClient = typeof window !== 'undefined';
    const savedGender = isClient ? localStorage.getItem('gender-value') as 'male' | 'female' | null : null;
    const savedSmartReminders = isClient ? localStorage.getItem('smart-reminders-enabled') !== 'false' : true; // Default true
    const hasCompletedTutorial = isClient ? localStorage.getItem('tutorial-completed') === 'true' : false;

    return {
        gender: savedGender || 'male',
        setGender: (gender) => {
            set({ gender });
            if (isClient) localStorage.setItem('gender-value', gender);
        },
        selectedMoleId: null,
        setSelectedMoleId: (id) => set({ selectedMoleId: id }),
        isAddingMole: false,
        setIsAddingMole: (isAdding) => set({ isAddingMole: isAdding }),
        tempMolePosition: null,
        setTempMolePosition: (pos) => set({ tempMolePosition: pos }),
        tempMoleNormal: null,
        setTempMoleNormal: (normal) => set({ tempMoleNormal: normal }),

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
        tutorialStep: 0, // Default to 0, logic in UIOverlay will trigger step 1 if needed
        setTutorialStep: (step) => set({ tutorialStep: step }),
        completeTutorial: () => {
            set({ tutorialStep: 0 });
            if (isClient) localStorage.setItem('tutorial-completed', 'true');
        }
    };
});
