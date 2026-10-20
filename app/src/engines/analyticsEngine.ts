import type { ActivityLog } from '../types/log';
import type { DailyAggregate, DonutSlice, HourlyBucket, TimeframeOption } from '../types/analytics';
import { ML_PER_OZ } from './guardrails';

export function getDatesForTimeframe(timeframe: TimeframeOption, logs: ActivityLog[]): string[] {
    const days = timeframe === '7D' ? 7 : (timeframe === '14D' ? 14 : (timeframe === '30D' ? 30 : (timeframe === '90D' ? 90 : 180)));
    const dates: string[] = [];
    const now = new Date();

    if (timeframe === 'All' && logs.length > 0) {
        const sorted = [...logs].sort((a, b) => a.timestamp - b.timestamp);
        const start = new Date(sorted[0].timestamp);
        const cur = new Date(start);
        while (cur <= now) {
            dates.push(cur.toISOString().split('T')[0]);
            cur.setDate(cur.getDate() + 1);
        }
        return dates.length > 0 ? dates : [now.toISOString().split('T')[0]];
    }

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
}

export function computeDailyAggregations(
    logs: ActivityLog[],
    dates: string[],
    metric: string
): DailyAggregate[] {
    return dates.map(dStr => {
        const dayLogs = logs.filter(l => l.dateStr === dStr);
        let primaryVal = 0;
        let sub1 = 0;
        let sub2 = 0;
        let sub3 = 0;
        let count = 0;

        if (metric === 'feeding') {
            dayLogs.forEach(l => {
                if ((l.category === 'feeding' || (l as any).category === 'nursing') && l.subType !== 'vitamins') {
                    count++;
                    const amt = l.amountMl || 0;
                    primaryVal += amt;
                    if (l.subType === 'formula') sub1 += amt;
                    else sub2 += amt; // Breastmilk
                }
            });
        } else if (metric === 'pumping') {
            dayLogs.forEach(l => {
                if (l.category === 'pumping') {
                    count++;
                    const left = l.leftAmountMl || 0;
                    const right = l.rightAmountMl || 0;
                    let amt = l.amountMl || 0;
                    if (amt === 0 && (left > 0 || right > 0)) amt = left + right;
                    primaryVal += amt;
                    if (left > 0 || right > 0) {
                        sub1 += left;
                        sub2 += right;
                    } else if (amt > 0) {
                        const half = Math.round(amt / 2);
                        sub1 += half;
                        sub2 += (amt - half);
                    }
                }
            });
        } else if (metric === 'diapers') {
            dayLogs.forEach(l => {
                if (l.category === 'diaper') {
                    count++;
                    primaryVal++;
                    if (l.subType === 'pee') sub1++;
                    else if (l.subType === 'poop') sub2++;
                    else if (l.subType === 'both') sub3++;
                    else sub1++;
                }
            });
        } else if (metric === 'sleep') {
            dayLogs.forEach(l => {
                if (l.category === 'sleep') {
                    count++;
                    const hrs = (l.durationMinutes || 0) / 60;
                    primaryVal += hrs;
                    let isNight = false;
                    if (l.isNightSleep !== undefined) {
                        isNight = !!l.isNightSleep;
                    } else if (l.timestamp) {
                        const hr = new Date(l.timestamp).getHours();
                        isNight = (hr >= 19 || hr < 7);
                    }
                    if (isNight) sub1 += hrs;
                    else sub2 += hrs;
                }
            });
        } else if (metric === 'tummy') {
            dayLogs.forEach(l => {
                if (l.category === 'tummy') {
                    count++;
                    const mins = l.durationMinutes || 0;
                    primaryVal += mins;
                    const hr = l.timestamp ? new Date(l.timestamp).getHours() : 12;
                    if (hr < 12) sub1 += mins;
                    else sub2 += mins;
                }
            });
        } else if (metric === 'growth') {
            const gLog = dayLogs.find(l => l.category === 'growth');
            if (gLog) {
                const lbs = gLog.weightLbs || 0;
                const oz = gLog.weightOz || 0;
                primaryVal = (lbs * 0.453592) + (oz * 0.0283495); // kg
                sub1 = gLog.heightInches || 0;
                sub2 = gLog.headCircumference || 0;
                count = 1;
            }
        }

        return {
            dateStr: dStr,
            label: dStr.substring(5),
            val: primaryVal,
            sub1,
            sub2,
            sub3,
            count
        };
    });
}

export function computeDonutSlices(
    dailyData: DailyAggregate[],
    metric: string,
    isOz: boolean
): { slices: DonutSlice[]; totalVal: number; unitStr: string } {
    let slices: DonutSlice[] = [];
    let totalVal = 0;
    let unitStr = isOz ? 'oz' : 'mL';

    if (metric === 'feeding') {
        const formula = dailyData.reduce((acc, d) => acc + d.sub1, 0);
        const breast = dailyData.reduce((acc, d) => acc + d.sub2, 0);
        totalVal = formula + breast;
        slices = [
            { name: 'Formula', val: formula, color: '#f59e0b', formatted: isOz ? `${(formula / ML_PER_OZ).toFixed(1)} oz` : `${Math.round(formula)} mL` },
            { name: 'Breastmilk', val: breast, color: '#f43f5e', formatted: isOz ? `${(breast / ML_PER_OZ).toFixed(1)} oz` : `${Math.round(breast)} mL` }
        ];
    } else if (metric === 'pumping') {
        const left = dailyData.reduce((acc, d) => acc + d.sub1, 0);
        const right = dailyData.reduce((acc, d) => acc + d.sub2, 0);
        totalVal = left + right;
        slices = [
            { name: 'Left Breast', val: left, color: '#ec4899', formatted: isOz ? `${(left / ML_PER_OZ).toFixed(1)} oz` : `${Math.round(left)} mL` },
            { name: 'Right Breast', val: right, color: '#0284c7', formatted: isOz ? `${(right / ML_PER_OZ).toFixed(1)} oz` : `${Math.round(right)} mL` }
        ];
    } else if (metric === 'diapers') {
        const pee = dailyData.reduce((acc, d) => acc + d.sub1, 0);
        const poop = dailyData.reduce((acc, d) => acc + d.sub2, 0);
        const both = dailyData.reduce((acc, d) => acc + d.sub3, 0);
        totalVal = pee + poop + both;
        unitStr = 'diapers';
        slices = [
            { name: 'Wet (Pee)', val: pee, color: '#eab308', formatted: `${pee} wet` },
            { name: 'Dirty (Poop)', val: poop, color: '#ea580c', formatted: `${poop} dirty` },
            { name: 'Both (Wet & Dirty)', val: both, color: '#8b5cf6', formatted: `${both} both` }
        ];
    } else if (metric === 'sleep') {
        const night = dailyData.reduce((acc, d) => acc + d.sub1, 0);
        const naps = dailyData.reduce((acc, d) => acc + d.sub2, 0);
        totalVal = night + naps;
        unitStr = 'hours';
        slices = [
            { name: 'Night Sleep', val: night, color: '#6366f1', formatted: `${night.toFixed(1)} hrs` },
            { name: 'Daytime Naps', val: naps, color: '#38bdf8', formatted: `${naps.toFixed(1)} hrs` }
        ];
    } else if (metric === 'tummy') {
        const morning = dailyData.reduce((acc, d) => acc + d.sub1, 0);
        const afternoon = dailyData.reduce((acc, d) => acc + d.sub2, 0);
        totalVal = morning + afternoon;
        unitStr = 'mins';
        slices = [
            { name: 'Morning Sessions', val: morning, color: '#f59e0b', formatted: `${Math.round(morning)} mins` },
            { name: 'Afternoon / Evening', val: afternoon, color: '#10b981', formatted: `${Math.round(afternoon)} mins` }
        ];
    } else if (metric === 'growth') {
        const weightCount = dailyData.filter(d => d.val > 0).length;
        const heightCount = dailyData.filter(d => d.sub1 > 0).length;
        const headCount = dailyData.filter(d => d.sub2 > 0).length;
        totalVal = weightCount + heightCount + headCount;
        unitStr = 'checks';
        slices = [
            { name: 'Weight Recorded', val: weightCount, color: '#3b82f6', formatted: `${weightCount} checks` },
            { name: 'Length Recorded', val: heightCount, color: '#10b981', formatted: `${heightCount} checks` },
            { name: 'Head Circ Recorded', val: headCount, color: '#8b5cf6', formatted: `${headCount} checks` }
        ];
    }

    return { slices, totalVal, unitStr };
}

export function computeHourlyBuckets(
    logs: ActivityLog[],
    dates: string[],
    metric: string,
    isOz: boolean
): { buckets: HourlyBucket[]; totalPeriodValue: number; maxVal: number; unitLabel: string } {
    const datesSet = new Set(dates);
    const filteredLogs = logs.filter(l => l.dateStr && datesSet.has(l.dateStr));

    const hourValues = new Array(24).fill(0);
    const hourCounts = new Array(24).fill(0);
    let totalPeriodValue = 0;
    let unitLabel = isOz ? 'oz' : 'mL';

    filteredLogs.forEach(l => {
        if (!l.timestamp) return;
        const hr = new Date(l.timestamp).getHours();
        if (hr < 0 || hr >= 24) return;

        if (metric === 'feeding' && (l.category === 'feeding' || (l as any).category === 'nursing') && l.subType !== 'vitamins') {
            const amt = l.amountMl || 0;
            hourValues[hr] += amt;
            hourCounts[hr]++;
            totalPeriodValue += amt;
        } else if (metric === 'pumping' && l.category === 'pumping') {
            const left = l.leftAmountMl || 0;
            const right = l.rightAmountMl || 0;
            let amt = l.amountMl || 0;
            if (amt === 0 && (left > 0 || right > 0)) amt = left + right;
            hourValues[hr] += amt;
            hourCounts[hr]++;
            totalPeriodValue += amt;
        } else if (metric === 'sleep' && l.category === 'sleep') {
            const hrs = (l.durationMinutes || 0) / 60;
            hourValues[hr] += hrs;
            hourCounts[hr]++;
            totalPeriodValue += hrs;
        } else if (metric === 'diapers' && l.category === 'diaper') {
            hourValues[hr] += 1;
            hourCounts[hr]++;
            totalPeriodValue += 1;
        } else if (metric === 'tummy' && l.category === 'tummy') {
            const mins = l.durationMinutes || 0;
            hourValues[hr] += mins;
            hourCounts[hr]++;
            totalPeriodValue += mins;
        } else if (metric === 'growth' && l.category === 'growth') {
            hourValues[hr] += 1;
            hourCounts[hr]++;
            totalPeriodValue += 1;
        }
    });

    if (metric === 'sleep') unitLabel = 'hrs';
    else if (metric === 'tummy') unitLabel = 'mins';
    else if (metric === 'diapers') unitLabel = 'diapers';
    else if (metric === 'growth') unitLabel = 'checks';

    const maxVal = Math.max(...hourValues, 1);

    const buckets: HourlyBucket[] = hourValues.map((val, hr) => {
        let daypart = '☀️ Afternoon';
        if (hr < 6) daypart = '🌙 Night';
        else if (hr >= 6 && hr < 12) daypart = '🌅 Morning';
        else if (hr >= 18) daypart = '🌆 Evening';

        let formatted = `${val}`;
        if (metric === 'feeding' || metric === 'pumping') {
            formatted = isOz ? `${(val / ML_PER_OZ).toFixed(1)} oz` : `${Math.round(val)} mL`;
        } else if (metric === 'sleep') {
            formatted = `${val.toFixed(1)} hrs`;
        } else if (metric === 'tummy') {
            formatted = `${Math.round(val)} mins`;
        } else {
            formatted = `${val} ${unitLabel}`;
        }

        return {
            hour: hr,
            val,
            count: hourCounts[hr],
            formatted,
            daypart
        };
    });

    return { buckets, totalPeriodValue, maxVal, unitLabel };
}
