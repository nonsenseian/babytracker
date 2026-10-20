export type ActivityCategory =
    | 'feeding'
    | 'pumping'
    | 'diaper'
    | 'sleep'
    | 'tummy'
    | 'growth'
    | 'health'
    | 'solids'
    | 'milestone'
    | 'bath'
    | 'other';

export type FeedSubType = 'bottle' | 'breastmilk' | 'formula' | 'nursing' | 'solids' | 'vitamins';
export type DiaperSubType = 'pee' | 'poop' | 'both';
export type DiaperSize = 'preemie' | 'nb' | 'size1' | 'size2' | 'size3' | 'size4' | 'size5' | 'size6';

export interface ActivityLog {
    id: string;
    childId?: string;
    category: ActivityCategory;
    subType?: string;
    dateStr: string;         // YYYY-MM-DD
    timeStr?: string;        // 12-hour format e.g. "2:30 PM"
    timestamp: number;       // Unix epoch ms
    updatedAt?: number;
    notes?: string;

    // Feeding & Pumping volumes
    amountMl?: number;
    leftAmountMl?: number;
    rightAmountMl?: number;
    durationMinutes?: number;

    // Diaper specifics
    size?: string;
    poopTexture?: string;

    // Sleep
    isNightSleep?: boolean;

    // Growth metrics
    weightLbs?: number;
    weightOz?: number;
    heightInches?: number;
    headCircumference?: number;

    // Health - Medication & Vitals
    medicationName?: string;
    dosage?: string;
    medRoute?: string;
    temperature?: number;
    tempUnit?: 'F' | 'C';
    measurementSite?: string;
    pulseBpm?: number;
    oxygenSat?: number;

    // Solids
    foodName?: string;
    portion?: string;
    reaction?: 'loved' | 'neutral' | 'disliked' | 'allergic_reaction';

    // Milestone
    milestoneTitle?: string;
}
