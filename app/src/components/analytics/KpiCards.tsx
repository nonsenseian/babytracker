import React from 'react';
import type { DailyAggregate } from '../../types/analytics';
import { ML_PER_OZ } from '../../engines/guardrails';

interface KpiCardsProps {
    dailyData: DailyAggregate[];
    metric: string;
    isOz: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ dailyData, metric, isOz }) => {
    const values = dailyData.map(d => d.val);
    const total = values.reduce((a, b) => a + b, 0);
    const count = dailyData.length;
    const avg = count > 0 ? (total / count) : 0;
    const peak = values.length > 0 ? Math.max(...values) : 0;

    const mid = Math.floor(count / 2);
    const firstHalf = values.slice(0, mid).reduce((a, b) => a + b, 0);
    const secondHalf = values.slice(mid).reduce((a, b) => a + b, 0);
    let trendPct = 0;
    if (firstHalf > 0) {
        trendPct = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
    }

    const formatVal = (v: number) => {
        if (metric === 'feeding' || metric === 'pumping') {
            return isOz ? `${(v / ML_PER_OZ).toFixed(1)} oz` : `${Math.round(v)} mL`;
        }
        if (metric === 'sleep') return `${v.toFixed(1)} hrs`;
        if (metric === 'tummy') return `${Math.round(v)} mins`;
        if (metric === 'diapers') return `${Math.round(v)} diapers`;
        if (metric === 'growth') return v > 0 ? `${(v * 2.20462).toFixed(1)} lbs` : '—';
        return `${Math.round(v)}`;
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
        }}>
            <div className="surface-card" style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Daily Average</div>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                    {formatVal(avg)}/d
                </div>
            </div>

            <div className="surface-card" style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total in Period</div>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                    {formatVal(total)}
                </div>
            </div>

            <div className="surface-card" style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peak Record Day</div>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                    {formatVal(peak)}
                </div>
            </div>

            <div className="surface-card" style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Period Trend</div>
                <div style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    fontFamily: 'JetBrains Mono, monospace',
                    marginTop: '4px',
                    color: trendPct >= 0 ? '#10b981' : '#f43f5e'
                }}>
                    {trendPct >= 0 ? `▲ +${trendPct}%` : `▼ ${trendPct}%`}
                </div>
            </div>
        </div>
    );
};
