import React, { useState } from 'react';
import type { DonutSlice } from '../../types/analytics';
import { ML_PER_OZ } from '../../engines/guardrails';

interface DonutChartProps {
    slices: DonutSlice[];
    totalVal: number;
    unitStr: string;
    metric: string;
    isOz: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({ slices, totalVal, unitStr, metric, isOz }) => {
    const [hoveredSlice, setHoveredSlice] = useState<DonutSlice | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

    const activeSlices = slices.filter(s => s.val > 0);

    if (totalVal <= 0 || activeSlices.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>No logged {metric} in this timeframe</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Record new activity to view proportional breakdown ring!</div>
            </div>
        );
    }

    const w = 700;
    const h = 260;
    const rOuter = 95;
    const rInner = 60;
    const cx = 220;
    const cy = 130;
    const legendX = 380;

    let currentAngle = -Math.PI / 2;

    const formattedTotal = (metric === 'feeding' || metric === 'pumping')
        ? (isOz ? `${(totalVal / ML_PER_OZ).toFixed(1)}` : `${Math.round(totalVal)}`)
        : (metric === 'sleep' ? `${totalVal.toFixed(1)}` : `${Math.round(totalVal)}`);

    return (
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                {activeSlices.length === 1 ? (
                    <path
                        d={`
                            M ${cx} ${cy - rOuter}
                            A ${rOuter} ${rOuter} 0 1 1 ${cx} ${cy + rOuter}
                            A ${rOuter} ${rOuter} 0 1 1 ${cx} ${cy - rOuter}
                            M ${cx} ${cy - rInner}
                            A ${rInner} ${rInner} 0 1 0 ${cx} ${cy + rInner}
                            A ${rInner} ${rInner} 0 1 0 ${cx} ${cy - rInner}
                            Z
                        `}
                        fill={activeSlices[0].color}
                        fillRule="evenodd"
                        style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                        onMouseEnter={(e) => {
                            setHoveredSlice(activeSlices[0]);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltipPos({ x: e.clientX - rect.left + 10, y: e.clientY - rect.top - 10 });
                        }}
                        onMouseLeave={() => setHoveredSlice(null)}
                    />
                ) : (
                    activeSlices.map((s) => {
                        const sliceFraction = s.val / totalVal;
                        const sliceAngle = sliceFraction * 2 * Math.PI;
                        const endAngle = currentAngle + sliceAngle;

                        const x1Outer = cx + rOuter * Math.cos(currentAngle);
                        const y1Outer = cy + rOuter * Math.sin(currentAngle);
                        const x2Outer = cx + rOuter * Math.cos(endAngle);
                        const y2Outer = cy + rOuter * Math.sin(endAngle);

                        const x1Inner = cx + rInner * Math.cos(endAngle);
                        const y1Inner = cy + rInner * Math.sin(endAngle);
                        const x2Inner = cx + rInner * Math.cos(currentAngle);
                        const y2Inner = cy + rInner * Math.sin(currentAngle);

                        const largeArc = sliceAngle > Math.PI ? 1 : 0;
                        const d = `
                            M ${x1Outer.toFixed(2)} ${y1Outer.toFixed(2)}
                            A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2Outer.toFixed(2)} ${y2Outer.toFixed(2)}
                            L ${x1Inner.toFixed(2)} ${y1Inner.toFixed(2)}
                            A ${rInner} ${rInner} 0 ${largeArc} 0 ${x2Inner.toFixed(2)} ${y2Inner.toFixed(2)}
                            Z
                        `;

                        currentAngle = endAngle;

                        return (
                            <path
                                key={s.name}
                                d={d}
                                fill={s.color}
                                stroke="var(--bg-surface)"
                                strokeWidth="2.5"
                                style={{
                                    cursor: 'pointer',
                                    transition: 'opacity 0.15s ease',
                                    opacity: hoveredSlice && hoveredSlice.name !== s.name ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => {
                                    setHoveredSlice(s);
                                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                    if (rect) {
                                        setTooltipPos({ x: e.clientX - rect.left + 10, y: e.clientY - rect.top - 10 });
                                    }
                                }}
                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                    if (rect) {
                                        setTooltipPos({ x: e.clientX - rect.left + 10, y: e.clientY - rect.top - 10 });
                                    }
                                }}
                                onMouseLeave={() => setHoveredSlice(null)}
                            />
                        );
                    })
                )}

                {/* Center Badge */}
                <text x={cx} y={cy - 12} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-muted)" letterSpacing="1.5">
                    TOTAL
                </text>
                <text x={cx} y={cy + 12} textAnchor="middle" fontSize="24" fontWeight="800" fill="var(--text-primary)" fontFamily="JetBrains Mono, monospace">
                    {formattedTotal}
                </text>
                <text x={cx} y={cy + 26} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">
                    {unitStr}
                </text>

                {/* Legend List */}
                {slices.map((s, idx) => {
                    const ly = 75 + (idx * 44);
                    const pct = totalVal > 0 ? Math.round((s.val / totalVal) * 100) : 0;
                    return (
                        <g key={s.name} transform={`translate(${legendX}, ${ly})`}>
                            <rect x="0" y="2" width="14" height="14" rx="4" fill={s.color} />
                            <text x="22" y="14" fontSize="13" fontWeight="700" fill="var(--text-primary)">
                                {s.name}: {s.formatted}
                            </text>
                            <text x="22" y="28" fontSize="11" fontWeight="600" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">
                                {pct}% of total
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Localized Floating Slice Tooltip */}
            {hoveredSlice && tooltipPos && (
                <div style={{
                    position: 'absolute',
                    left: `${tooltipPos.x}px`,
                    top: `${tooltipPos.y}px`,
                    pointerEvents: 'none',
                    zIndex: 20,
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                    transform: 'translate(-50%, -100%)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: hoveredSlice.color }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: hoveredSlice.color }} />
                        {hoveredSlice.name}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        {hoveredSlice.formatted}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                        {totalVal > 0 ? Math.round((hoveredSlice.val / totalVal) * 100) : 0}% of total {metric}
                    </div>
                </div>
            )}
        </div>
    );
};
