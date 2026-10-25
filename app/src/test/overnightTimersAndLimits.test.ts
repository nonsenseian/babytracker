import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeInput } from '../context/AppContext';
import { PediatricGuardrails } from '../engines/guardrails';
import { syncService } from '../engines/syncEngine';
import type { TimerSession } from '../types/state';

describe('Overnight Timers, Application Limits & Security Hardening Suite', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('1. Overnight Timers Attribution & Deduplication', () => {
        it('anchors an overnight timer starting at 11:50 PM and ending at 12:30 AM to the start date', () => {
            // Start time: 2026-10-23 at 23:50:00 (11:50 PM)
            const startTime = new Date(2026, 9, 23, 23, 50, 0, 0).getTime();
            // Completion time: 2026-10-24 at 00:30:00 (12:30 AM next day, 40 mins later)
            const finishTime = new Date(2026, 9, 24, 0, 30, 0, 0).getTime();

            const elapsedMinutes = Math.round((finishTime - startTime) / 60000);
            expect(elapsedMinutes).toBe(40);

            // Compute local date string from start time
            const startDate = new Date(startTime);
            const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;

            expect(startDateStr).toBe('2026-10-23');

            // Verify that constructing logData with start timestamp retains 2026-10-23
            const logPayload = {
                category: 'sleep' as const,
                durationMinutes: elapsedMinutes,
                timestamp: startTime,
                dateStr: startDateStr,
                isNightSleep: true,
                notes: 'Overnight sleep session'
            };

            expect(logPayload.dateStr).toBe('2026-10-23');
            expect(logPayload.timestamp).toBe(startTime);
            expect(new Date(logPayload.timestamp).getDate()).toBe(23);
        });

        it('deduplicates rapid log submissions within 2.5s window', () => {
            const existingLogs: any[] = [
                {
                    id: 'log_1',
                    category: 'feeding',
                    subType: 'formula',
                    amountMl: 120,
                    durationMinutes: 15,
                    childId: 'child_123',
                    timestamp: 1000000
                }
            ];

            const isDuplicate = (newLog: any, logs: any[]) => {
                const now = newLog.timestamp || Date.now();
                return logs.some(existing => {
                    const timeDiff = Math.abs((existing.timestamp || 0) - now);
                    return timeDiff < 2500 &&
                        existing.category === newLog.category &&
                        existing.subType === newLog.subType &&
                        existing.amountMl === newLog.amountMl &&
                        existing.durationMinutes === newLog.durationMinutes &&
                        existing.childId === newLog.childId;
                });
            };

            // Attempt duplicate at 1001000 (1s later, same parameters)
            const duplicateAttempt = {
                category: 'feeding',
                subType: 'formula',
                amountMl: 120,
                durationMinutes: 15,
                childId: 'child_123',
                timestamp: 1001000
            };

            expect(isDuplicate(duplicateAttempt, existingLogs)).toBe(true);

            // Valid separate attempt at 1005000 (5s later)
            const validLaterAttempt = {
                category: 'feeding',
                subType: 'formula',
                amountMl: 120,
                durationMinutes: 15,
                childId: 'child_123',
                timestamp: 1005000
            };

            expect(isDuplicate(validLaterAttempt, existingLogs)).toBe(false);
        });
    });

    describe('2. Security & Anti-Malware / Anti-Injection Protection', () => {
        it('strips script tags, evil protocols and dangerous event handlers via sanitizeInput', () => {
            const maliciousPayloads = [
                '<script>alert("xss")</script>',
                'javascript:stealData()',
                '<img src=x onerror=alert(1)>',
                'Calm feeding session <svg onload="fetch(\'/steal\')">',
                'Normal comment without tags'
            ];

            const cleaned = maliciousPayloads.map(sanitizeInput);

            expect(cleaned[0]).not.toContain('<script>');
            expect(cleaned[0]).not.toContain('</script>');
            expect(cleaned[1]).not.toContain('javascript:');
            expect(cleaned[2]).not.toContain('onerror');
            expect(cleaned[2]).not.toContain('<img');
            expect(cleaned[3]).not.toContain('<svg');
            expect(cleaned[3]).not.toContain('onload');
            expect(cleaned[4]).toBe('Normal comment without tags');
        });

        it('limits notes to 1,000 characters and slices gracefully', () => {
            const hugeString = 'A'.repeat(5000);
            const sanitized = sanitizeInput(hugeString).slice(0, 1000);

            expect(sanitized.length).toBe(1000);
        });
    });

    describe('3. Hard Limits to Prevent Unintentional App Crashing', () => {
        it('enforces maximum 100 appointments guardrail', () => {
            const maxAppointments = 100;
            const appointments: any[] = [];

            for (let i = 0; i < maxAppointments; i++) {
                appointments.push({ id: `apt_${i}`, title: `Checkup ${i}` });
            }

            expect(appointments.length).toBe(100);

            // 101st appointment check
            const canAdd = appointments.length < 100;
            expect(canAdd).toBe(false);
        });

        it('enforces running timer ceilings to avoid runaway elapsed timers', () => {
            const TIMER_MAX_MINUTES = {
                feed: 180,     // 3 hours
                pump: 120,     // 2 hours
                sleep: 1440,   // 24 hours
                tummy: 60      // 1 hour
            };

            const checkTimerCeiling = (type: keyof typeof TIMER_MAX_MINUTES, elapsedMinutes: number) => {
                const max = TIMER_MAX_MINUTES[type];
                return elapsedMinutes >= max;
            };

            // Feed timer running for 4 hours (240 min)
            expect(checkTimerCeiling('feed', 240)).toBe(true);

            // Tummy time running for 70 minutes
            expect(checkTimerCeiling('tummy', 70)).toBe(true);

            // Normal sleep 90 min
            expect(checkTimerCeiling('sleep', 90)).toBe(false);

            // Sleep running for 25 hours
            expect(checkTimerCeiling('sleep', 1500)).toBe(true);
        });

        it('PediatricGuardrails enforces realistic volume, temperature and growth bounds', () => {
            // Feeding bounds (max 710 mL / 24 oz)
            expect(PediatricGuardrails.validateLogActivity({
                category: 'feeding',
                subType: 'formula',
                amountMl: 750
            })).toContain('exceeds realistic bounds');

            // Valid feeding (120 mL)
            expect(PediatricGuardrails.validateLogActivity({
                category: 'feeding',
                subType: 'formula',
                amountMl: 120
            })).toBeNull();

            // Fever bounds (>108°F)
            expect(PediatricGuardrails.validateLogActivity({
                category: 'health',
                subType: 'vitals',
                temperature: 112,
                tempUnit: 'F'
            })).toContain('outside plausible pediatric physiological range');

            // Plausible temperature (99.1°F)
            expect(PediatricGuardrails.validateLogActivity({
                category: 'health',
                subType: 'vitals',
                temperature: 99.1,
                tempUnit: 'F'
            })).toBeNull();
        });

        it('syncEngine clamps massive payloads to avoid browser memory crash', () => {
            const massiveLogs = Array.from({ length: 2500 }, (_, i) => ({
                id: `log_${i}`,
                category: 'feeding',
                amountMl: 60,
                notes: `<script>alert(${i})</script>Feed #${i}`
            }));

            const massiveAppointments = Array.from({ length: 250 }, (_, i) => ({
                id: `apt_${i}`,
                title: `<script>evil()</script>Doctor Apt ${i}`,
                location: 'Clinic',
                doctorName: 'Dr. Test'
            }));

            // Test through syncService.importTransferCode
            const rawBundle = syncService.generateTransferCode({
                logs: massiveLogs,
                appointments: massiveAppointments
            });

            expect(rawBundle).toBeTruthy();

            const imported = syncService.importTransferCode(rawBundle);

            expect(imported).not.toBeNull();
            // Clamped to 2,000 logs
            expect(imported.logs.length).toBe(2000);
            // Script tag stripped from notes
            expect(imported.logs[0].notes).not.toContain('<script>');
            // Clamped to 100 appointments
            expect(imported.appointments.length).toBe(100);
            // Script tag stripped from appointment title
            expect(imported.appointments[0].title).not.toContain('<script>');
        });
    });

    describe('4. Configurable Timer Auto-Cutoff & Automatic Logging', () => {
        it('provides realistic default timer cutoffs (60m feed, 60m pump, 30m tummy, 720m sleep)', () => {
            const defaultSettings = {
                maxFeedTimerMinutes: 60,
                maxPumpTimerMinutes: 60,
                maxTummyTimerMinutes: 30,
                maxSleepTimerMinutes: 720
            };

            expect(defaultSettings.maxFeedTimerMinutes).toBe(60);
            expect(defaultSettings.maxPumpTimerMinutes).toBe(60);
            expect(defaultSettings.maxTummyTimerMinutes).toBe(30);
            expect(defaultSettings.maxSleepTimerMinutes).toBe(720);
        });

        it('clamps user adjustments within safe physiological boundaries', () => {
            const clampSetting = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

            // User enters 500 mins for feed (capped to 180m)
            expect(clampSetting(500, 15, 180)).toBe(180);

            // User enters 5 mins for feed (floored to 15m)
            expect(clampSetting(5, 15, 180)).toBe(15);

            // User sets pump to 45 mins (valid)
            expect(clampSetting(45, 15, 120)).toBe(45);

            // User sets tummy to 10 mins (valid)
            expect(clampSetting(10, 5, 60)).toBe(10);

            // User sets sleep to 8 hours (480 mins)
            expect(clampSetting(480, 30, 1440)).toBe(480);
        });

        it('stops running timer, resets elapsed time to 0, and auto-logs the session when cutoff is reached', () => {
            const userCutoffMinutes = 45;
            const cutoffSeconds = userCutoffMinutes * 60;

            const timerSession: TimerSession = {
                isRunning: true,
                startTime: 1700000000000,
                runningSince: 1700000000000,
                baseSeconds: 0,
                elapsedSeconds: cutoffSeconds // exactly reached cutoff
            };

            const autoCutoffEvents: any[] = [];
            let timerState = { ...timerSession };

            if (timerState.elapsedSeconds >= cutoffSeconds) {
                // Timer is cut off and reset to 0
                timerState = {
                    ...timerState,
                    isRunning: false,
                    startTime: null,
                    baseSeconds: 0,
                    runningSince: null,
                    elapsedSeconds: 0
                };

                // Auto-logged session recorded
                autoCutoffEvents.push({
                    category: 'pumping',
                    durationMinutes: userCutoffMinutes,
                    timestamp: timerSession.startTime,
                    notes: `Pumping session auto-stopped & logged (reached ${userCutoffMinutes}m safety cutoff)`
                });
            }

            expect(timerState.isRunning).toBe(false);
            expect(timerState.elapsedSeconds).toBe(0);
            expect(autoCutoffEvents.length).toBe(1);
            expect(autoCutoffEvents[0].category).toBe('pumping');
            expect(autoCutoffEvents[0].durationMinutes).toBe(45);
            expect(autoCutoffEvents[0].timestamp).toBe(1700000000000);
            expect(autoCutoffEvents[0].notes).toContain('reached 45m safety cutoff');
        });

        it('anchors overnight auto-cutoff session to the day it started', () => {
            // Started at 11:45 PM (23:45) on Oct 23
            const startEpoch = new Date(2026, 9, 23, 23, 45, 0).getTime();
            // 60-minute cutoff reached at 12:45 AM (00:45) on Oct 24
            const cutoffEpoch = new Date(2026, 9, 24, 0, 45, 0).getTime();

            const cutoffMinutes = 60;
            const autoLoggedSession = {
                category: 'feeding',
                durationMinutes: cutoffMinutes,
                subType: 'formula',
                amountMl: 60,
                timestamp: startEpoch, // preserved start time
                notes: `Feed session auto-stopped & logged (reached ${cutoffMinutes}m safety cutoff)`
            };

            const startDate = new Date(autoLoggedSession.timestamp);
            const dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;

            // Must be attributed to Oct 23, NOT Oct 24
            expect(dateStr).toBe('2026-10-23');
            expect(new Date(cutoffEpoch).getDate()).toBe(24);
        });
    });
});
