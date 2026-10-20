export interface ShiftProtocol {
    id: string;
    text: string;
    category?: 'feeding' | 'soothing' | 'medication' | 'general';
    createdAt: number;
}

export interface CaregiverShiftState {
    activeCaregiverId: string;
    shiftStartTime: number;
    pinnedProtocols: ShiftProtocol[];
    lastHandoverTime?: number;
    lastHandoverNotes?: string;
}
