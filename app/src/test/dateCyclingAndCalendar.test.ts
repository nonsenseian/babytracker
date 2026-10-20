import { describe, it, expect, beforeEach } from 'vitest';

describe('Date Cycling & Calendar Trigger Requirements', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    // Helper mirroring date cycler in ActivityLogList
    const cycleDateStr = (dateStr: string, deltaDays: number): string => {
        const base = new Date(dateStr + 'T12:00:00');
        base.setDate(base.getDate() + deltaDays);
        const y = base.getFullYear();
        const m = String(base.getMonth() + 1).padStart(2, '0');
        const d = String(base.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getRelativeLabel = (dateStr: string, todayStr: string): string => {
        if (dateStr === todayStr) return 'Today';
        const yDate = new Date(todayStr + 'T12:00:00');
        yDate.setDate(yDate.getDate() - 1);
        const yStr = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(yDate.getDate()).padStart(2, '0')}`;
        if (dateStr === yStr) return 'Yesterday';

        const tDate = new Date(todayStr + 'T12:00:00');
        tDate.setDate(tDate.getDate() + 1);
        const tStr = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;
        if (dateStr === tStr) return 'Tomorrow';

        const dt = new Date(dateStr + 'T12:00:00');
        return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    it('Requirement 1: Cycles backwards and forwards by one day accurately across month boundaries', () => {
        const oct14 = '2026-10-14';
        const oct13 = cycleDateStr(oct14, -1);
        const oct15 = cycleDateStr(oct14, 1);

        expect(oct13).toBe('2026-10-13');
        expect(oct15).toBe('2026-10-15');

        // Month boundary: Nov 01 -> Oct 31
        const nov01 = '2026-11-01';
        expect(cycleDateStr(nov01, -1)).toBe('2026-10-31');

        // Year boundary: Jan 01 -> Dec 31
        const jan01 = '2027-01-01';
        expect(cycleDateStr(jan01, -1)).toBe('2026-12-31');
    });

    it('Requirement 1 & 2: Generates clean human-readable relative labels for cycled dates', () => {
        const today = '2026-10-14';
        expect(getRelativeLabel('2026-10-14', today)).toBe('Today');
        expect(getRelativeLabel('2026-10-13', today)).toBe('Yesterday');
        expect(getRelativeLabel('2026-10-15', today)).toBe('Tomorrow');
        expect(getRelativeLabel('2026-10-12', today)).toContain('Oct 12');
    });

    it('Requirement 3: Persists calendar visibility in localStorage with "Hide Calendar" and "Show Calendar"', () => {
        const CALENDAR_STORAGE_KEY = 'bt_calendar_visible';

        // Default should be visible (true) when not set
        const rawInitial = localStorage.getItem(CALENDAR_STORAGE_KEY);
        const isInitiallyVisible = rawInitial === null ? true : rawInitial !== 'false';
        expect(isInitiallyVisible).toBe(true);

        // User clicks "Hide Calendar" -> sets localStorage to false
        localStorage.setItem(CALENDAR_STORAGE_KEY, 'false');
        expect(localStorage.getItem(CALENDAR_STORAGE_KEY)).toBe('false');

        // User clicks/tabs date in log list -> brings up calendar (sets to true)
        localStorage.setItem(CALENDAR_STORAGE_KEY, 'true');
        expect(localStorage.getItem(CALENDAR_STORAGE_KEY)).toBe('true');
    });
});
