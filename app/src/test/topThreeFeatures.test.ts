import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getBabyAgeWeeks,
    getBaseWakeWindow,
    calculateSweetNapPrediction
} from '../engines/sweetNapEngine';
import { generateDoctorDossier } from '../engines/dossierEngine';
import { VoiceAssistant } from '../engines/voiceEngine';
import type { ActivityLog } from '../types/log';
import type { ChildProfile } from '../types/profile';

describe('Feature 1: Adaptive SweetNap Predictive Sleep Engine', () => {
    it('calculates baby age in decimal weeks accurately', () => {
        const fakeNow = new Date('2026-10-14T12:00:00Z').getTime();
        // Born 2 weeks ago
        const birthDate = '2026-09-30';
        const weeks = getBabyAgeWeeks(birthDate, fakeNow);
        expect(weeks).toBe(2);
    });

    it('returns correct AAP wake window brackets according to baby age', () => {
        expect(getBaseWakeWindow(2).targetMinutes).toBe(50); // 0-4 wks
        expect(getBaseWakeWindow(2).bracketLabel).toContain('0–4 Wks');

        expect(getBaseWakeWindow(8).targetMinutes).toBe(75); // 1-3 mos
        expect(getBaseWakeWindow(8).bracketLabel).toContain('1–3 Months');

        expect(getBaseWakeWindow(14).targetMinutes).toBe(95); // 3-4 mos
        expect(getBaseWakeWindow(20).targetMinutes).toBe(125); // 4-6 mos
        expect(getBaseWakeWindow(30).targetMinutes).toBe(165); // 6-9 mos
        expect(getBaseWakeWindow(45).targetMinutes).toBe(200); // 9-12 mos
        expect(getBaseWakeWindow(60).targetMinutes).toBe(270); // 1-2 yrs
    });

    it('dynamically adapts wake window when last nap was a short catnap (<30 min)', () => {
        const now = 1792000000000;
        const lastSleepEnd = now - (30 * 60000); // 30 min ago
        const logs: ActivityLog[] = [
            {
                id: 'sleep_1',
                category: 'sleep',
                timestamp: lastSleepEnd - (20 * 60000),
                durationMinutes: 20, // 20m catnap
                dateStr: '2026-10-15'
            }
        ];

        // 8 weeks old base target is 75 mins
        const pred = calculateSweetNapPrediction({
            birthDateStr: '2026-08-20',
            logs,
            isSleepingNow: false,
            now
        });

        // 75m - 15m deduction = 60m effective wake window
        expect(pred.baseWakeWindowMinutes).toBe(75);
        expect(pred.effectiveWakeWindowMinutes).toBe(60);
        expect(pred.adjustmentNotice).toContain('Adjusted -15m for short catnap (20m)');
    });

    it('dynamically extends wake window when last nap was restorative (>=90 min)', () => {
        const now = 1792000000000;
        const lastSleepEnd = now - (30 * 60000);
        const logs: ActivityLog[] = [
            {
                id: 'sleep_long',
                category: 'sleep',
                timestamp: lastSleepEnd - (105 * 60000),
                durationMinutes: 105, // 1h 45m restorative nap
                dateStr: '2026-10-15'
            }
        ];

        const pred = calculateSweetNapPrediction({
            birthDateStr: '2026-08-20', // ~8 wks, base 75m
            logs,
            isSleepingNow: false,
            now
        });

        // 75m + 15m extension = 90m effective wake window
        expect(pred.baseWakeWindowMinutes).toBe(75);
        expect(pred.effectiveWakeWindowMinutes).toBe(90);
        expect(pred.adjustmentNotice).toContain('Extended +15m for restorative nap (1h 45m)');
    });

    it('transitions sleep pressure status correctly (rested -> wind_down -> sweet_spot -> overtired)', () => {
        const now = 1792000000000;
        // Case A: Just woke up 20m ago (window = 80m, pressure = 25% -> rested)
        const predRested = calculateSweetNapPrediction({
            birthDateStr: '2026-08-20',
            logs: [{ id: 's1', category: 'sleep', timestamp: now - (60 * 60000), durationMinutes: 40, dateStr: '2026-10-15' }],
            now
        });
        expect(predRested.status).toBe('rested');

        // Case B: Awake for 68m (pressure = 68/75 = 90% -> sweet_spot)
        const predSweetSpot = calculateSweetNapPrediction({
            birthDateStr: '2026-08-20',
            logs: [{ id: 's2', category: 'sleep', timestamp: now - (108 * 60000), durationMinutes: 40, dateStr: '2026-10-15' }],
            now
        });
        expect(predSweetSpot.status).toBe('sweet_spot');
        expect(predSweetSpot.statusLabel).toContain('SweetSpot Now!');

        // Case C: Awake for 110m (window = 75m -> pressure > 110% -> overtired)
        const predOvertired = calculateSweetNapPrediction({
            birthDateStr: '2026-08-20',
            logs: [{ id: 's3', category: 'sleep', timestamp: now - (150 * 60000), durationMinutes: 40, dateStr: '2026-10-15' }],
            now
        });
        expect(predOvertired.status).toBe('overtired');
        expect(predOvertired.statusColor).toBe('#ef4444');
    });

    it('handles active sleeping state when sleep stopwatch is running', () => {
        const now = 1792000000000;
        const predSleeping = calculateSweetNapPrediction({
            birthDateStr: '2026-08-20',
            logs: [],
            isSleepingNow: true,
            sleepStartTime: now - (45 * 60000),
            now
        });

        expect(predSleeping.isSleepingNow).toBe(true);
        expect(predSleeping.status).toBe('sleeping');
        expect(predSleeping.currentSleepElapsedMinutes).toBe(45);
        expect(predSleeping.statusLabel).toContain('Baby is currently sleeping');
    });
});

describe('Feature 2: 1-Click Pediatrician Visit Dossier Engine', () => {
    const mockChild: ChildProfile = {
        id: 'child_1',
        name: 'Baby Ian',
        birthDate: '2026-09-02',
        gender: 'boy',
        currentWeight: '9 lbs 4 oz',
        pediatrician: 'Dr. Sarah Smith, MD',
        clinic: 'Westside Pediatrics',
        allergies: 'None known',
        bloodType: 'O+'
    };

    it('aggregates 7-day clinical totals, averages, and formula/breastmilk ratios', () => {
        const dNow = new Date();
        const todayStr = `${dNow.getFullYear()}-${String(dNow.getMonth() + 1).padStart(2, '0')}-${String(dNow.getDate()).padStart(2, '0')}`;
        const mockLogs: ActivityLog[] = [
            { id: '1', category: 'feeding', subType: 'formula', amountMl: 120, dateStr: todayStr, timestamp: Date.now() },
            { id: '2', category: 'feeding', subType: 'breastmilk', amountMl: 80, dateStr: todayStr, timestamp: Date.now() },
            { id: '3', category: 'diaper', subType: 'pee', dateStr: todayStr, timestamp: Date.now() },
            { id: '4', category: 'diaper', subType: 'both', dateStr: todayStr, timestamp: Date.now() },
            { id: '5', category: 'sleep', durationMinutes: 120, isNightSleep: true, dateStr: todayStr, timestamp: Date.now() },
            { id: '6', category: 'tummy', durationMinutes: 15, dateStr: todayStr, timestamp: Date.now() },
            { id: '7', category: 'feeding', subType: 'vitamins', amountMl: 20, dateStr: todayStr, timestamp: Date.now() }
        ];

        const report = generateDoctorDossier(mockChild, mockLogs, 7);

        expect(report.childName).toBe('Baby Ian');
        expect(report.totalMilkMl).toBe(200);
        expect(report.formulaRatioPercent).toBe(60); // 120 / 200 = 60%
        expect(report.breastmilkRatioPercent).toBe(40); // 80 / 200 = 40%
        expect(report.totalWetDiapers).toBe(2); // 1 pee + 1 both
        expect(report.totalDirtyDiapers).toBe(1); // 1 both
        expect(report.longestSleepStretchMinutes).toBe(120);
        expect(report.vitaminDaysLogged).toBe(1);
    });

    it('formats a clean clinical copy string for patient portals (MyChart/Epic)', () => {
        const report = generateDoctorDossier(mockChild, [], 7);
        expect(report.formattedClinicalSummary).toContain('PEDIATRIC HEALTH & VITALS DOSSIER — BABY IAN');
        expect(report.formattedClinicalSummary).toContain('Westside Pediatrics');
        expect(report.formattedClinicalSummary).toContain('Dr. Sarah Smith, MD');
        expect(report.formattedClinicalSummary).toContain('1. INTAKE & FEEDING:');
        expect(report.formattedClinicalSummary).toContain('2. HYDRATION & OUTPUT:');
        expect(report.formattedClinicalSummary).toContain('3. SLEEP PATTERN:');
        expect(report.formattedClinicalSummary).toContain('4. DEVELOPMENT & VITAMINS:');
    });

    it('evaluates AAP hydration standard (>= 6 wet diapers/day)', () => {
        const dNow = new Date();
        const todayStr = `${dNow.getFullYear()}-${String(dNow.getMonth() + 1).padStart(2, '0')}-${String(dNow.getDate()).padStart(2, '0')}`;
        // 42 wet diapers across 7 days = 6.0/day
        const logs: ActivityLog[] = [];
        for (let i = 0; i < 42; i++) {
            logs.push({
                id: `diaper_${i}`,
                category: 'diaper',
                subType: 'pee',
                dateStr: todayStr,
                timestamp: Date.now()
            });
        }

        const reportAdequate = generateDoctorDossier(mockChild, logs, 7);
        expect(reportAdequate.avgWetPerDay).toBe(6);
        expect(reportAdequate.isHydrationAdequate).toBe(true);

        const reportSparse = generateDoctorDossier(mockChild, logs.slice(0, 14), 7); // 2/day
        expect(reportSparse.isHydrationAdequate).toBe(false);
    });
});

describe('Feature 3: Voice Engine SweetNap Integration', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('responds to "next nap" and "sweet spot" voice queries', () => {
        const statusReplies: string[] = [];
        VoiceAssistant.init(
            {
                onLogFeed: () => {},
                onLogDiaper: () => {},
                onLogQuick: () => {},
                onStatusQuery: (reply) => statusReplies.push(reply),
                onError: () => {}
            },
            () => [
                {
                    id: 's1',
                    category: 'sleep',
                    durationMinutes: 45,
                    timestamp: Date.now() - (40 * 60000),
                    dateStr: '2026-10-15'
                }
            ],
            () => ({
                id: 'child_1',
                name: 'Baby Ian',
                birthDate: '2026-09-02'
            }),
            () => ({} as any)
        );

        VoiceAssistant.simulateCommand('when is the next nap');
        expect(statusReplies.length).toBeGreaterThan(0);
        expect(statusReplies[0]).toContain("Baby Ian's next nap");

        VoiceAssistant.simulateCommand('what is the sweet spot');
        expect(statusReplies.length).toBe(2);
        expect(statusReplies[1]).toContain('SweetSpot');
    });
});
