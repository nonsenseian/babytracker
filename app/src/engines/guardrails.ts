import type { ActivityLog } from '../types/log';

export const ML_PER_OZ = 29.5735;

export const PediatricGuardrails = {
    LIMITS: {
        feedMl: { min: 5, max: 710 },          // Up to 24 oz single feed
        pumpMl: { min: 5, max: 950 },          // Up to 32 oz single pump
        durationMinutes: { min: 1, max: 180 }, // Up to 3 hours
        pumpMinutes: { min: 1, max: 120 },     // Up to 2 hours
        sleepMinutes: { min: 5, max: 1440 },   // Up to 24 hours
        tummyMinutes: { min: 1, max: 60 },     // Up to 60 mins
        weightLbs: { min: 1.0, max: 45.0 },    // 1 to 45 lbs infant
        heightInches: { min: 10.0, max: 48.0 },// 10 to 48 in
        headCircInches: { min: 8.0, max: 25.0 } // 8 to 25 in
    },

    validateLogActivity(log: Partial<ActivityLog>): string | null {
        if (log.category === 'feeding') {
            if (log.amountMl && log.amountMl > this.LIMITS.feedMl.max) {
                return `Feed amount (${(log.amountMl / ML_PER_OZ).toFixed(0)} oz / ${log.amountMl} mL) exceeds realistic bounds. Stomach capacity is up to 24 oz.`;
            }
            if (log.durationMinutes && log.durationMinutes > this.LIMITS.durationMinutes.max) {
                return `Feeding duration cannot exceed 3 hours.`;
            }
        }
        if (log.category === 'pumping') {
            if (log.amountMl && log.amountMl > this.LIMITS.pumpMl.max) {
                return `Pumped output (${(log.amountMl / ML_PER_OZ).toFixed(0)} oz / ${log.amountMl} mL) exceeds realistic bounds.`;
            }
            if (log.durationMinutes && log.durationMinutes > this.LIMITS.pumpMinutes.max) {
                return `Pumping session duration cannot exceed 2 hours.`;
            }
        }
        if (log.category === 'sleep') {
            if (log.durationMinutes && log.durationMinutes > this.LIMITS.sleepMinutes.max) {
                return `Sleep duration cannot exceed 24 hours.`;
            }
        }
        if (log.category === 'tummy') {
            if (log.durationMinutes && log.durationMinutes > this.LIMITS.tummyMinutes.max) {
                return `Tummy time session cannot exceed 60 minutes for infant comfort.`;
            }
        }
        if (log.category === 'growth') {
            if (log.weightLbs !== undefined) {
                const totalLbs = log.weightLbs + ((log.weightOz || 0) / 16);
                if (totalLbs < this.LIMITS.weightLbs.min || totalLbs > this.LIMITS.weightLbs.max) {
                    return `Weight (${totalLbs.toFixed(1)} lbs) is outside realistic pediatric bounds (1.0 - 45.0 lbs).`;
                }
            }
            if (log.heightInches !== undefined && (log.heightInches < this.LIMITS.heightInches.min || log.heightInches > this.LIMITS.heightInches.max)) {
                return `Length/Height (${log.heightInches} in) is outside realistic bounds (10.0 - 48.0 inches).`;
            }
            if (log.headCircumference !== undefined && (log.headCircumference < this.LIMITS.headCircInches.min || log.headCircumference > this.LIMITS.headCircInches.max)) {
                return `Head circumference (${log.headCircumference} in) is outside realistic bounds (8.0 - 25.0 inches).`;
            }
        }
        return null;
    }
};
