export type AppTheme =
    | 'simple-daylight'
    | 'simple-moonlight'
    | 'soft-pastel'
    | 'forest-sage'
    | 'high-contrast-dark'
    | 'vintage-warmth'
    | 'soil'
    | 'pixelated-arcade'
    | 'arcade';

export type MeasurementUnit = 'mL' | 'oz';

export type ActiveTab = 'tracker' | 'metrics' | 'profile';

export interface TimerSession {
    isRunning: boolean;
    startTime: number | null;
    elapsedSeconds: number;
    baseSeconds?: number;
    runningSince?: number | null;
    discardMilkStartTime?: number | null;
}

export interface TimersState {
    feed: TimerSession;
    pump: TimerSession;
    sleep: TimerSession;
    tummy: TimerSession;
}

export interface ReminderConfig {
    intervalHours: number;
    lastEventTime: number | null;
    nextTargetTime: number | null;
}

export interface AppSettings {
    voiceReminders: boolean;
    reminderChimes: boolean;
    voiceTrigger: 'hey nova' | 'hey tracker' | 'always';
    defaultFeedVolume: number;
    defaultFeedType: 'formula' | 'breastmilk' | 'nursing';
    defaultPumpAmount: number;
    defaultNapMinutes: number;
    defaultTummyMinutes: number;
    feedIntervalHours: number;
    pumpIntervalHours: number;
    isLayoutEditMode: boolean;
    hiddenSections: string[];
    sectionOrder: string[];
    quickLogOrder?: string[];
    hiddenQuickLogIds?: string[];
    pinnedQuickLogIds?: string[];
    isQuickLogCollapsed?: boolean;
    timerOrder?: string[];
    hiddenTimerIds?: string[];
    profileSectionOrder?: string[];
    hiddenProfileSections?: string[];
    metricsSectionOrder?: string[];
    hiddenMetricsSections?: string[];
}

