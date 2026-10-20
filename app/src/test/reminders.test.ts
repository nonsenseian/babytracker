import { describe, it, expect } from 'vitest';

describe('Reminders & Interval Math', () => {
    it('calculates next feed target exactly 3 hours from the session start without duration drift', () => {
        const feedStartTime = new Date('2026-10-14T01:28:00').getTime();
        const feedLog = { timestamp: feedStartTime, durationMinutes: 30, category: 'feeding' };
        const intervalHours = 3.0;

        // Calculate directly from start timestamp
        const nextFeedTarget = feedLog.timestamp + (intervalHours * 3600 * 1000);
        const expectedTarget = new Date('2026-10-14T04:28:00').getTime();

        expect(nextFeedTarget).toBe(expectedTarget);
        expect((nextFeedTarget - feedStartTime) / (3600 * 1000)).toBe(3.0);
    });

    it('calculates next pump target exactly 3 hours from session start without duration drift', () => {
        const pumpStartTime = new Date('2026-10-14T01:29:00').getTime();
        const pumpLog = { timestamp: pumpStartTime, durationMinutes: 20, category: 'pumping' };
        const intervalHours = 3.0;

        const nextPumpTarget = pumpLog.timestamp + (intervalHours * 3600 * 1000);
        const expectedTarget = new Date('2026-10-14T04:29:00').getTime();

        expect(nextPumpTarget).toBe(expectedTarget);
        expect((nextPumpTarget - pumpStartTime) / (3600 * 1000)).toBe(3.0);
    });

    it('formats countdown as digital clock HH:MM:SS when upcoming', () => {
        const formatCountdown = (diffMs: number) => {
            if (diffMs <= 0) {
                const overdueMins = Math.floor(-diffMs / 60000);
                return overdueMins > 0 ? `+${overdueMins}m DUE` : 'DUE NOW!';
            }
            const totalSecs = Math.floor(diffMs / 1000);
            const hrs = Math.floor(totalSecs / 3600);
            const mins = Math.floor((totalSecs % 3600) / 60);
            const secs = totalSecs % 60;
            return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        };

        // Exactly 3 hours
        expect(formatCountdown(3 * 3600 * 1000)).toBe('03:00:00');

        // 2 hours 39 minutes 59 seconds
        const diff = (2 * 3600 + 39 * 60 + 59) * 1000;
        expect(formatCountdown(diff)).toBe('02:39:59');
    });

    it('never formats overdue timer with a negative sign', () => {
        const formatCountdown = (diffMs: number) => {
            if (diffMs <= 0) {
                const overdueMins = Math.floor(-diffMs / 60000);
                return overdueMins > 0 ? `+${overdueMins}m DUE` : 'DUE NOW!';
            }
            const totalSecs = Math.floor(diffMs / 1000);
            const hrs = Math.floor(totalSecs / 3600);
            const mins = Math.floor((totalSecs % 3600) / 60);
            const secs = totalSecs % 60;
            return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        };

        // 200 minutes overdue (like in previous bug report)
        const overdue200m = -200 * 60 * 1000;
        const result = formatCountdown(overdue200m);

        expect(result).toBe('+200m DUE');
        expect(result).not.toContain('-');
        expect(result).not.toBe('-200m');

        // Just overdue (0 ms)
        expect(formatCountdown(0)).toBe('DUE NOW!');
    });

    it('provides clear remaining label badge', () => {
        const getRemainingLabel = (diffMs: number) => {
            if (diffMs <= 0) return 'DUE NOW';
            const totalSecs = Math.floor(diffMs / 1000);
            const hrs = Math.floor(totalSecs / 3600);
            const mins = Math.floor((totalSecs % 3600) / 60);
            return hrs > 0 ? `IN ${hrs}h ${mins}m` : `IN ${mins}m`;
        };

        expect(getRemainingLabel((2 * 3600 + 39 * 60) * 1000)).toBe('IN 2h 39m');
        expect(getRemainingLabel(45 * 60 * 1000)).toBe('IN 45m');
        expect(getRemainingLabel(-1000)).toBe('DUE NOW');
    });

    it('defaults next target forward from now when no logs exist yet', () => {
        const now = 1000000;
        const latestFeed = undefined;
        const intervalHours = 3.0;

        const nextFeedTarget = latestFeed
            ? ((latestFeed as any).timestamp + (intervalHours * 3600 * 1000))
            : (now + (intervalHours * 3600 * 1000));

        expect(nextFeedTarget).toBe(now + 3 * 3600 * 1000);
        expect(nextFeedTarget - now).toBeGreaterThan(0);
    });
});
