import Dexie, { type Table } from 'dexie';

export interface Mole {
    id?: number;
    label: string;
    gender: 'male' | 'female';
    position: [number, number, number]; // [x, y, z] in 3D space
    normal?: [number, number, number];   // [x, y, z] surface normal
    createdAt: number;
    starred?: boolean;
    type?: 'mole' | 'eczema' | 'acne' | 'psoriasis' | 'rash' | 'other';
    count?: number | 'several';
    spread?: number;
}

export interface MoleEntry {
    id?: number;
    moleId: number;
    date: number;
    photo?: string; // Base64 or Blob URL
    size: number; // in mm
    texture?: string;
    notes: string;
    // AR metadata placeholders
    referenceObject?: string; // e.g., 'coin', 'ruler'
    scaleReference?: number; // scale factor
    abcde?: string[]; // Array of checked letters ['A', 'C', etc.]

    // Condition-specific fields
    severity?: number; // 0-10 intensity
    symptoms?: string[]; // e.g. ['Itchy', 'Dry', 'Bleeding', 'Flaking']
    flareUp?: boolean; // Is this an active flare-up?
}

export class AppDatabase extends Dexie {
    moles!: Table<Mole>;
    entries!: Table<MoleEntry>;

    constructor() {
        super('TrackAMoleDB');
        this.version(4).stores({
            moles: '++id, label, gender, starred',
            entries: '++id, moleId, date'
        });
    }
}

export const db = new AppDatabase();
