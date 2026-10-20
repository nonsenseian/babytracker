export type ChartMode = 'spline' | 'bar' | 'donut' | 'timeline';
export type TimeframeOption = '7D' | '14D' | '30D' | '90D' | 'All';

export interface DailyAggregate {
    dateStr: string;
    label: string;
    val: number;
    sub1: number;
    sub2: number;
    sub3: number;
    count: number;
}

export interface DonutSlice {
    name: string;
    val: number;
    color: string;
    formatted: string;
}

export interface HourlyBucket {
    hour: number;
    val: number;
    count: number;
    formatted: string;
    daypart: string;
}
