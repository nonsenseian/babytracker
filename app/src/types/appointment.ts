export interface BabyAppointment {
    id: string;
    childId?: string;
    title: string;
    date: string;            // YYYY-MM-DD
    time: string;            // HH:MM e.g. "10:00"
    durationMinutes: number; // e.g. 30
    location?: string;       // e.g. "Westside Pediatrics, Suite 200"
    notes?: string;          // e.g. "2-Month vaccines, check hip dysplasia"
    doctorName?: string;     // e.g. "Dr. Sarah Smith, MD"
    createdAt?: number;      // timestamp ms
    updatedAt?: number;      // timestamp ms
}
