import Dexie, { type Table } from 'dexie';

export interface Mole {
    id?: number;
    label: string;
    gender: 'male' | 'female';
    position: [number, number, number]; // [x, y, z] in 3D space
    createdAt: number;
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
}

export class AppDatabase extends Dexie {
    moles!: Table<Mole>;
    entries!: Table<MoleEntry>;

    constructor() {
        super('TrackAMoleDB');
        this.version(2).stores({
            moles: '++id, label, gender',
            entries: '++id, moleId, date'
        });
    }
}

export const db = new AppDatabase();
