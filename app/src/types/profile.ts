export interface ChildProfile {
    id: string;
    name: string;
    birthDate: string; // YYYY-MM-DD
    gender?: 'girl' | 'boy' | 'other' | '';
    avatarEmoji?: string;
    birthWeightLbs?: number;
    birthWeightOz?: number;
    currentWeight?: string;
    dueDate?: string;
    birthHeightInches?: number;
    birthHeadCircInches?: number;
    allergies?: string;
    pediatrician?: string;
    pediatricianPhone?: string;
    clinic?: string;
    bloodType?: string;
    notes?: string;
}

export interface Caregiver {
    id: string;
    name: string;
    role: string;
    emoji: string;
}

export interface Appointment {
    id: string;
    title: string;
    date: string;
    time: string;
    doctor?: string;
    location?: string;
    notes?: string;
}
