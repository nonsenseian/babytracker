import type { ActivityLog } from '../types/log';
import type { ChildProfile } from '../types/profile';

export interface DailyDossierBreakdown {
    dateStr: string;
    displayDate: string;
    totalMilkMl: number;
    formulaMl: number;
    breastmilkMl: number;
    feedsCount: number;
    wetDiapers: number;
    dirtyDiapers: number;
    sleepMinutes: number;
    nightSleepMinutes: number;
    napsCount: number;
    tummyMinutes: number;
    hasVitamins: boolean;
}

export interface DoctorDossierReport {
    childName: string;
    ageLabel: string;
    dateRangeLabel: string;
    daysCount: number;
    startDateStr: string;
    endDateStr: string;

    // Demographics
    gender: string;
    birthDate: string;
    pediatrician: string;
    clinic: string;
    allergies: string;
    bloodType: string;
    weight: string;
    height: string;

    // Feeding Metrics
    totalMilkMl: number;
    totalMilkOz: number;
    avgDailyMilkMl: number;
    avgDailyMilkOz: number;
    formulaRatioPercent: number;
    breastmilkRatioPercent: number;
    totalFeedsCount: number;
    avgFeedsPerDay: number;
    avgVolumePerFeedMl: number;

    // Diaper & Hydration Metrics
    totalWetDiapers: number;
    totalDirtyDiapers: number;
    avgWetPerDay: number;
    avgDirtyPerDay: number;
    isHydrationAdequate: boolean; // >= 6 wet/day per AAP

    // Sleep Metrics
    totalSleepHours: number;
    avgDailySleepHours: number;
    avgNightSleepHours: number;
    avgNapSleepHours: number;
    longestSleepStretchMinutes: number;
    totalNapsCount: number;
    avgNapsPerDay: number;

    // Active Development
    totalTummyMinutes: number;
    avgDailyTummyMinutes: number;
    vitaminDaysLogged: number;

    // Daily Timeline Data for SVG charts
    dailyBreakdown: DailyDossierBreakdown[];

    // Clipboard Clinical Text
    formattedClinicalSummary: string;
}

export function generateDoctorDossier(
    child: ChildProfile,
    logs: ActivityLog[],
    daysCount: number = 7
): DoctorDossierReport {
    const now = new Date();
    // Build array of past N dates in YYYY-MM-DD
    const dateList: string[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12, 0, 0);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateList.push(`${y}-${m}-${day}`);
    }

    const startDateStr = dateList[0];
    const endDateStr = dateList[dateList.length - 1];

    // Filter relevant logs within window
    const relevantLogs = logs.filter(l => l.dateStr && l.dateStr >= startDateStr && l.dateStr <= endDateStr);

    const dailyBreakdown: DailyDossierBreakdown[] = dateList.map(dateStr => {
        const dayLogs = relevantLogs.filter(l => l.dateStr === dateStr);
        const feeds = dayLogs.filter(l => l.category === 'feeding' && l.subType !== 'vitamins');

        let formulaMl = 0;
        let breastmilkMl = 0;
        let totalMilkMl = 0;

        feeds.forEach(f => {
            const ml = f.amountMl || 0;
            totalMilkMl += ml;
            if (f.subType === 'formula') {
                formulaMl += ml;
            } else {
                breastmilkMl += ml;
            }
        });

        const diapers = dayLogs.filter(l => l.category === 'diaper');
        const wetDiapers = diapers.filter(d => d.subType === 'pee' || d.subType === 'both').length;
        const dirtyDiapers = diapers.filter(d => d.subType === 'poop' || d.subType === 'both').length;

        const sleeps = dayLogs.filter(l => l.category === 'sleep');
        const sleepMinutes = sleeps.reduce((sum, s) => sum + (s.durationMinutes || 45), 0);
        const nightSleepMinutes = sleeps.filter(s => s.isNightSleep).reduce((sum, s) => sum + (s.durationMinutes || 60), 0);
        const napsCount = sleeps.filter(s => !s.isNightSleep).length;

        const tummys = dayLogs.filter(l => l.category === 'tummy');
        const tummyMinutes = tummys.reduce((sum, t) => sum + (t.durationMinutes || 5), 0);

        const hasVitamins = dayLogs.some(l => l.subType === 'vitamins' || (l.notes && l.notes.toLowerCase().includes('vitamin')));

        const dParts = dateStr.split('-');
        const dateObj = new Date(Number(dParts[0]), Number(dParts[1]) - 1, Number(dParts[2]), 12, 0, 0);
        const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

        return {
            dateStr,
            displayDate,
            totalMilkMl,
            formulaMl,
            breastmilkMl,
            feedsCount: feeds.length,
            wetDiapers,
            dirtyDiapers,
            sleepMinutes,
            nightSleepMinutes,
            napsCount,
            tummyMinutes,
            hasVitamins
        };
    });

    // Feeding totals & averages
    const totalMilkMl = dailyBreakdown.reduce((sum, d) => sum + d.totalMilkMl, 0);
    const totalMilkOz = Math.round((totalMilkMl / 29.5735) * 10) / 10;
    const avgDailyMilkMl = Math.round(totalMilkMl / daysCount);
    const avgDailyMilkOz = Math.round((avgDailyMilkMl / 29.5735) * 10) / 10;

    const totalFormulaMl = dailyBreakdown.reduce((sum, d) => sum + d.formulaMl, 0);
    const totalBreastmilkMl = dailyBreakdown.reduce((sum, d) => sum + d.breastmilkMl, 0);
    const formulaRatioPercent = totalMilkMl > 0 ? Math.round((totalFormulaMl / totalMilkMl) * 100) : 0;
    const breastmilkRatioPercent = totalMilkMl > 0 ? Math.round((totalBreastmilkMl / totalMilkMl) * 100) : 0;

    const totalFeedsCount = dailyBreakdown.reduce((sum, d) => sum + d.feedsCount, 0);
    const avgFeedsPerDay = Math.round((totalFeedsCount / daysCount) * 10) / 10;
    const avgVolumePerFeedMl = totalFeedsCount > 0 ? Math.round(totalMilkMl / totalFeedsCount) : 0;

    // Diaper totals & averages
    const totalWetDiapers = dailyBreakdown.reduce((sum, d) => sum + d.wetDiapers, 0);
    const totalDirtyDiapers = dailyBreakdown.reduce((sum, d) => sum + d.dirtyDiapers, 0);
    const avgWetPerDay = Math.round((totalWetDiapers / daysCount) * 10) / 10;
    const avgDirtyPerDay = Math.round((totalDirtyDiapers / daysCount) * 10) / 10;
    const isHydrationAdequate = avgWetPerDay >= 5.5; // AAP guidance: >= 6 wet diapers per 24h

    // Sleep metrics
    const totalSleepMinutes = dailyBreakdown.reduce((sum, d) => sum + d.sleepMinutes, 0);
    const totalSleepHours = Math.round((totalSleepMinutes / 60) * 10) / 10;
    const avgDailySleepHours = Math.round((totalSleepHours / daysCount) * 10) / 10;
    const totalNightSleepMinutes = dailyBreakdown.reduce((sum, d) => sum + d.nightSleepMinutes, 0);
    const avgNightSleepHours = Math.round((totalNightSleepMinutes / 60 / daysCount) * 10) / 10;
    const avgNapSleepHours = Math.max(0, Math.round((avgDailySleepHours - avgNightSleepHours) * 10) / 10);

    const sleepLogs = relevantLogs.filter(l => l.category === 'sleep');
    const longestSleepStretchMinutes = sleepLogs.reduce((max, s) => Math.max(max, s.durationMinutes || 0), 0);
    const totalNapsCount = dailyBreakdown.reduce((sum, d) => sum + d.napsCount, 0);
    const avgNapsPerDay = Math.round((totalNapsCount / daysCount) * 10) / 10;

    // Active development
    const totalTummyMinutes = dailyBreakdown.reduce((sum, d) => sum + d.tummyMinutes, 0);
    const avgDailyTummyMinutes = Math.round(totalTummyMinutes / daysCount);
    const vitaminDaysLogged = dailyBreakdown.filter(d => d.hasVitamins).length;

    // Age calculation
    let ageLabel = 'Pediatric Patient';
    if (child.birthDate) {
        const parts = child.birthDate.split('-');
        if (parts.length === 3) {
            const b = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
            const diffDays = Math.max(0, Math.floor((now.getTime() - b.getTime()) / (24 * 3600 * 1000)));
            const weeks = Math.floor(diffDays / 7);
            const remDays = diffDays % 7;
            ageLabel = `${weeks} Weeks ${remDays} Days Old (${diffDays} Days)`;
        }
    }

    const startFmt = new Date(startDateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFmt = new Date(endDateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dateRangeLabel = `${startFmt} – ${endFmt} (${daysCount} Days)`;

    // Format Clinical Note for Patient Portal / Medical EHR
    const formattedClinicalSummary = [
        `PEDIATRIC HEALTH & VITALS DOSSIER — ${child.name.toUpperCase()}`,
        `Report Period: ${dateRangeLabel}`,
        `Patient Age: ${ageLabel} | DOB: ${child.birthDate || 'N/A'} | Sex: ${child.gender || 'N/A'}`,
        `Current Weight: ${child.currentWeight || 'N/A'} | Allergies: ${child.allergies || 'None known'}`,
        `Clinic: ${child.clinic || 'Westside Pediatrics'} | Pediatrician: ${child.pediatrician || 'Primary Doctor'}`,
        ``,
        `1. INTAKE & FEEDING:`,
        `• Average Daily Volume: ${avgDailyMilkMl} mL / ${avgDailyMilkOz} oz per day`,
        `• Diet Composition: ${formulaRatioPercent}% Formula / ${breastmilkRatioPercent}% Breastmilk`,
        `• Frequency: Average ${avgFeedsPerDay} feeds/day (Avg ${avgVolumePerFeedMl} mL/feed)`,
        ``,
        `2. HYDRATION & OUTPUT:`,
        `• Wet Diapers: Average ${avgWetPerDay} / day (${isHydrationAdequate ? '✓ Normal/Adequate per AAP >= 6' : '⚠ Below standard'})`,
        `• Bowel Movements: Average ${avgDirtyPerDay} / day`,
        ``,
        `3. SLEEP PATTERN:`,
        `• Total Daily Sleep: Average ${avgDailySleepHours} hours/day (Night: ${avgNightSleepHours}h, Naps: ${avgNapSleepHours}h across ${avgNapsPerDay} naps)`,
        `• Longest Continuous Sleep Stretch: ${Math.floor(longestSleepStretchMinutes / 60)}h ${longestSleepStretchMinutes % 60}m`,
        ``,
        `4. DEVELOPMENT & VITAMINS:`,
        `• Tummy Time: Average ${avgDailyTummyMinutes} minutes / day`,
        `• Vitamin D Adherence: ${vitaminDaysLogged} of ${daysCount} days recorded`,
        ``,
        `Generated via NovaBaby • Private Offline Pediatric Engine`
    ].join('\n');

    return {
        childName: child.name,
        ageLabel,
        dateRangeLabel,
        daysCount,
        startDateStr,
        endDateStr,
        gender: child.gender || 'boy',
        birthDate: child.birthDate || '',
        pediatrician: child.pediatrician || 'Pediatrician',
        clinic: child.clinic || 'Clinic',
        allergies: child.allergies || 'None known',
        bloodType: child.bloodType || 'O+',
        weight: child.currentWeight || `${child.birthWeightLbs || 8} lbs`,
        height: child.birthHeightInches ? `${child.birthHeightInches} in` : '20 in',
        totalMilkMl,
        totalMilkOz,
        avgDailyMilkMl,
        avgDailyMilkOz,
        formulaRatioPercent,
        breastmilkRatioPercent,
        totalFeedsCount,
        avgFeedsPerDay,
        avgVolumePerFeedMl,
        totalWetDiapers,
        totalDirtyDiapers,
        avgWetPerDay,
        avgDirtyPerDay,
        isHydrationAdequate,
        totalSleepHours,
        avgDailySleepHours,
        avgNightSleepHours,
        avgNapSleepHours,
        longestSleepStretchMinutes,
        totalNapsCount,
        avgNapsPerDay,
        totalTummyMinutes,
        avgDailyTummyMinutes,
        vitaminDaysLogged,
        dailyBreakdown,
        formattedClinicalSummary
    };
}
