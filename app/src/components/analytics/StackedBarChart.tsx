import React, { useState } from 'react';
import type { DailyAggregate } from '../../types/analytics';
import { ML_PER_OZ } from '../../engines/guardrails';

interface StackedBarChartProps {
    dailyData: DailyAggregate[];
    metric: string;
    isOz: boolean;
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({ dailyData, metric, isOz }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const w = 720;
    const h = 260;
    const xPadLeft = 45;
    const xPadRight = 25;
    const yPadTop = 28;
    const yPadBottom = 42;
    const plotW = w - xPadLeft - xPadRight;
    const plotH = h - yPadTop - yPadBottom;
    const baselineY = yPadTop + plotH;

    const values = dailyData.map(d => d.val);
    let maxVal = Math.max(...values, 10);
    if (metric === 'growth') maxVal = Math.max(maxVal, 8);
    maxVal = Math.ceil(maxVal * 1.15);

    const count = dailyData.length;
    const stepX = plotW / count;
    const colWidth = Math.min(32, Math.max(8, stepX * 0.55));

    const getColors = () => {
        if (metric === 'pumping') return { base: '#0284c7', sub: '#ec4899' };
        if (metric === 'feeding') return { base: '#f43f5e', sub: '#f59e0b' };
        if (metric === 'sleep') return { base: '#38bdf8', sub: '#6366f1' };
        if (metric === 'diapers') return { base: '#ea580c', sub: '#eab308' };
        if (metric === 'tummy') return { base: '#10b981', sub: '#f59e0b' };
        return { base: '#f59e0b', sub: '#fb923c' };
    };

    const colors = getColors();
    const hoveredPoint = hoveredIdx !== null ? dailyData[hoveredIdx] : null;

    return (
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                {/* Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                    const y = baselineY - (f * plotH);
                    const labelVal = Math.round(f * maxVal);
                    const formatted = (metric === 'feeding' || metric === 'pumping')
                        ? (isOz ? `${(labelVal / ML_PER_OZ).toFixed(0)}oz` : `${labelVal}`)
                        : `${labelVal}`;
                    return (
                        <g key={f}>
                            <line x1={xPadLeft} y1={y} x2={w - xPadRight} y2={y} stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="1" />
                            <text x={xPadLeft - 8} y={y + 3.5} textAnchor="end" fontSize="10" fontWeight="600" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">
                                {formatted}
                            </text>
                        </g>
                    );
                })}

                {/* Bars */}
                {dailyData.map((d, i) => {
                    const cx = xPadLeft + (i * stepX) + (stepX / 2);
                    const bx = cx - (colWidth / 2);
                    const totalH = maxVal > 0 ? (d.val / maxVal) * plotH : 0;
                    const by = baselineY - totalH;
                    const subH = maxVal > 0 ? (d.sub1 / maxVal) * plotH : 0;

                    return (
                        <g
                            key={d.dateStr}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                        >
                            <rect
                                x={bx}
                                y={by}
                                width={colWidth}
                                height={totalH}
                                rx="4"
                                fill={colors.base}
                                opacity={hoveredIdx !== null && hoveredIdx !== i ? 0.4 : 0.85}
                            />
                            {d.sub1 > 0 && (
                                <rect
                                    x={bx}
                                    y={baselineY - subH}
                                    width={colWidth}
                                    height={subH}
                                    rx="4"
                                    fill={colors.sub}
                                    opacity={0.95}
                                />
                            )}

                            {/* X-axis labels */}
                            {(i % 2 === 0 || i === count - 1) && (
                                <text x={cx} y={h - 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">
                                    {d.label}
                                </text>
                            )}
                        </g>
                    );
                })}

                <line x1={xPadLeft} y1={baselineY} x2={w - xPadRight} y2={baselineY} stroke="var(--border-color)" strokeWidth="1" />
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '20px',
                    transform: 'translateX(-50%)',
                    pointerEvents: 'none',
                    zIndex: 20,
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                    whiteSpace: 'nowrap'
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>
                        {hoveredPoint.dateStr}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        {metric === 'feeding' || metric === 'pumping'
                            ? (isOz ? `${(hoveredPoint.val / ML_PER_OZ).toFixed(1)} oz` : `${Math.round(hoveredPoint.val)} mL`)
                            : (metric === 'sleep' ? `${hoveredPoint.val.toFixed(1)} hrs` : `${Math.round(hoveredPoint.val)}`)}
                    </div>
                </div>
            )}
        </div>
    );
};
