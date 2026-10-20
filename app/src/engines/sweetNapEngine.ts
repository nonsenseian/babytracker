import type { ActivityLog } from '../types/log';

export interface WakeWindowBracket {
    minMinutes: number;
    maxMinutes: number;
    targetMinutes: number;
    bracketLabel: string;
    expectedNapsPerDay: string;
}

export interface SweetNapResult {
    isSleepingNow: boolean;
    currentSleepElapsedMinutes?: number;
    lastSleepEndTime: number | null;
    lastSleepDurationMinutes: number;
    awakeElapsedMinutes: number;
    baseWakeWindowMinutes: number;
    effectiveWakeWindowMinutes: number;
    targetNapStartTime: number;
    targetNapEndTime: number;
    minutesUntilTarget: number;
    sleepPressurePercent: number; // 0 to 130%
    status: 'sleeping' | 'rested' | 'wind_down' | 'sweet_spot' | 'overtired';
    statusLabel: string;
    statusSubtext: string;
    statusColor: string;
    adjustmentNotice?: string;
    ageBracketLabel: string;
    ageWeeks: number;
    expectedNapsPerDay: string;
}

/**
 * Calculates baby's age in decimal weeks accurately avoiding timezone day shifts
 */
export function getBabyAgeWeeks(birthDateStr: string, now: number = Date.now()): number {
    if (!birthDateStr) return 6; // default 6 weeks if unset
    try {
        const parts = birthDateStr.split('-');
        if (parts.length !== 3) return 6;
        const [y, m, d] = parts.map(Number);
        const birthDate = new Date(y, m - 1, d, 12, 0, 0); // midday local
        const diffMs = now - birthDate.getTime();
        const weeks = diffMs / (7 * 24 * 3600 * 1000);
        return Math.max(0, Math.round(weeks * 10) / 10);
    } catch {
        return 6;
    }
}

/**
 * Returns AAP/Weissbluth age-based wake window brackets
 */
export function getBaseWakeWindow(ageWeeks: number): WakeWindowBracket {
    if (ageWeeks <= 4) {
        return { minMinutes: 45, maxMinutes: 60, targetMinutes: 50, bracketLabel: '0–4 Wks (Newborn)', expectedNapsPerDay: '4–6 Naps' };
    }
    if (ageWeeks <= 12) {
        return { minMinutes: 60, maxMinutes: 90, targetMinutes: 75, bracketLabel: '1–3 Months', expectedNapsPerDay: '4–5 Naps' };
    }
    if (ageWeeks <= 16) {
        return { minMinutes: 75, maxMinutes: 120, targetMinutes: 95, bracketLabel: '3–4 Months', expectedNapsPerDay: '3–4 Naps' };
    }
    if (ageWeeks <= 26) {
        return { minMinutes: 105, maxMinutes: 150, targetMinutes: 125, bracketLabel: '4–6 Months', expectedNapsPerDay: '3 Naps' };
    }
    if (ageWeeks <= 38) {
        return { minMinutes: 135, maxMinutes: 195, targetMinutes: 165, bracketLabel: '6–9 Months', expectedNapsPerDay: '2–3 Naps' };
    }
    if (ageWeeks <= 52) {
        return { minMinutes: 165, maxMinutes: 240, targetMinutes: 200, bracketLabel: '9–12 Months', expectedNapsPerDay: '2 Naps' };
    }
    return { minMinutes: 210, maxMinutes: 330, targetMinutes: 270, bracketLabel: '1–2 Years', expectedNapsPerDay: '1 Nap' };
}

export interface CalculateSweetNapOptions {
    birthDateStr: string;
    logs: ActivityLog[];
    isSleepingNow?: boolean;
    sleepStartTime?: number | null;
    now?: number;
}

/**
 * Real-time adaptive predictive nap & wake-window engine
 */
export function calculateSweetNapPrediction(options: CalculateSweetNapOptions): SweetNapResult {
    const now = options.now || Date.now();
    const ageWeeks = getBabyAgeWeeks(options.birthDateStr, now);
    const bracket = getBaseWakeWindow(ageWeeks);

    // 1. If baby is currently actively napping in live timers
    if (options.isSleepingNow) {
        const sleepStart = options.sleepStartTime || (now - 600000);
        const elapsed = Math.max(0, Math.floor((now - sleepStart) / 60000));
        return {
            isSleepingNow: true,
            currentSleepElapsedMinutes: elapsed,
            lastSleepEndTime: null,
            lastSleepDurationMinutes: elapsed,
            awakeElapsedMinutes: 0,
            baseWakeWindowMinutes: bracket.targetMinutes,
            effectiveWakeWindowMinutes: bracket.targetMinutes,
            targetNapStartTime: now + bracket.targetMinutes * 60000,
            targetNapEndTime: now + (bracket.targetMinutes + 20) * 60000,
            minutesUntilTarget: bracket.targetMinutes,
            sleepPressurePercent: 0,
            status: 'sleeping',
            statusLabel: 'Baby is currently sleeping',
            statusSubtext: `Asleep for ${Math.floor(elapsed / 60)}h ${elapsed % 60}m. Wake window will reset upon waking.`,
            statusColor: '#8b5cf6',
            ageBracketLabel: bracket.bracketLabel,
            ageWeeks,
            expectedNapsPerDay: bracket.expectedNapsPerDay
        };
    }

    // 2. Find the most recent sleep log
    const sleepLogs = (options.logs || [])
        .filter(l => l.category === 'sleep')
        .sort((a, b) => b.timestamp - a.timestamp);

    const latestSleep = sleepLogs[0];
    let lastSleepEndTime: number;
    let lastSleepDurationMinutes = 45;
    let adjustmentNotice: string | undefined;

    if (latestSleep) {
        lastSleepDurationMinutes = latestSleep.durationMinutes || 45;
        // If duration is recorded, end time is timestamp + duration. If timestamp represents completion, end is timestamp.
        // In NovaBaby, timestamp represents the start or log creation time.
        lastSleepEndTime = latestSleep.timestamp + (latestSleep.durationMinutes ? latestSleep.durationMinutes * 60000 : 0);
        // Sanity check: lastSleepEndTime cannot be in the future beyond now
        if (lastSleepEndTime > now) {
            lastSleepEndTime = now;
        }
    } else {
        // Fallback: estimate waking at 7:00 AM local time today or 1.5 hours ago
        const d = new Date(now);
        d.setHours(7, 0, 0, 0);
        lastSleepEndTime = d.getTime() < now ? d.getTime() : now - (bracket.targetMinutes * 60000);
        adjustmentNotice = 'Estimated from morning wake-up (no naps logged yet today)';
    }

    // 3. Dynamic Adaptation for Short / Long Naps
    let effectiveWakeWindowMinutes = bracket.targetMinutes;

    if (latestSleep && latestSleep.durationMinutes) {
        const dur = latestSleep.durationMinutes;
        if (dur < 30) {
            // Catnap: less restorative, sleep pressure rebounds faster
            const deduction = 15;
            effectiveWakeWindowMinutes = Math.max(35, effectiveWakeWindowMinutes - deduction);
            adjustmentNotice = `Adjusted -${deduction}m for short catnap (${dur}m)`;
        } else if (dur >= 90) {
            // Long restorative nap: baby is well rested, expand window
            const addition = 15;
            effectiveWakeWindowMinutes = Math.min(360, effectiveWakeWindowMinutes + addition);
            adjustmentNotice = `Extended +${addition}m for restorative nap (${Math.floor(dur / 60)}h ${dur % 60}m)`;
        }
    }

    const awakeElapsedMinutes = Math.max(0, Math.floor((now - lastSleepEndTime) / 60000));
    const targetNapStartTime = lastSleepEndTime + (effectiveWakeWindowMinutes * 60000);
    const targetNapEndTime = targetNapStartTime + (20 * 60000); // 20-minute sweetspot window
    const minutesUntilTarget = Math.round((targetNapStartTime - now) / 60000);

    const sleepPressurePercent = Math.min(130, Math.max(0, Math.round((awakeElapsedMinutes / effectiveWakeWindowMinutes) * 100)));

    // 4. Status determination
    let status: SweetNapResult['status'];
    let statusLabel: string;
    let statusSubtext: string;
    let statusColor: string;

    if (sleepPressurePercent < 65) {
        status = 'rested';
        statusLabel = 'Rested & Alert';
        statusSubtext = `Plenty of wake time left. Ideal for tummy time, feeding, and interaction.`;
        statusColor = '#10b981'; // Emerald
    } else if (sleepPressurePercent < 85) {
        status = 'wind_down';
        statusLabel = 'Wind-Down Window Approaching';
        statusSubtext = `Dim lights, reduce stimulation, and watch for yawning or eye-rubbing cues.`;
        statusColor = '#f59e0b'; // Amber
    } else if (sleepPressurePercent <= 110) {
        status = 'sweet_spot';
        statusLabel = 'SweetSpot Now! (Ideal Nap Time)';
        statusSubtext = `Highest sleep drive with minimal resistance. Soothe and put down for nap now.`;
        statusColor = '#3b82f6'; // Sky / Blue
    } else {
        status = 'overtired';
        statusLabel = 'Overtired Danger Zone';
        statusSubtext = `Wake window exceeded by ${awakeElapsedMinutes - effectiveWakeWindowMinutes}m. Cortisol may cause fussiness.`;
        statusColor = '#ef4444'; // Red
    }

    return {
        isSleepingNow: false,
        lastSleepEndTime,
        lastSleepDurationMinutes,
        awakeElapsedMinutes,
        baseWakeWindowMinutes: bracket.targetMinutes,
        effectiveWakeWindowMinutes,
        targetNapStartTime,
        targetNapEndTime,
        minutesUntilTarget,
        sleepPressurePercent,
        status,
        statusLabel,
        statusSubtext,
        statusColor,
        adjustmentNotice,
        ageBracketLabel: bracket.bracketLabel,
        ageWeeks,
        expectedNapsPerDay: bracket.expectedNapsPerDay
    };
}
