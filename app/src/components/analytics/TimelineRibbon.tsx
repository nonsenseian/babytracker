import React, { useState } from 'react';
import type { HourlyBucket } from '../../types/analytics';

interface TimelineRibbonProps {
    buckets: HourlyBucket[];
    maxVal: number;
    totalPeriodValue: number;
    metric: string;
}

export const TimelineRibbon: React.FC<TimelineRibbonProps> = ({ buckets, maxVal, totalPeriodValue, metric }) => {
    const [hoveredBucket, setHoveredBucket] = useState<HourlyBucket | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

    if (totalPeriodValue <= 0) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏰</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>No logged {metric} in this timeframe</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Switch timeframes or record new activity to view circadian distribution!</div>
            </div>
        );
    }

    const w = 720;
    const h = 260;
    const xPadLeft = 45;
    const xPadRight = 25;
    const yPadTop = 56;
    const yPadBottom = 40;
    const plotW = w - xPadLeft - xPadRight;
    const plotH = h - yPadTop - yPadBottom;
    const baselineY = yPadTop + plotH;
    const stepX = plotW / 24;
    const colW = Math.max(4, stepX * 0.68);

    const getDaypartColor = (hr: number) => {
        if (hr < 6) return '#4f46e5'; // Deep Night
        if (hr >= 6 && hr < 12) return '#f59e0b'; // Morning
        if (hr >= 12 && hr < 18) return '#0284c7'; // Afternoon
        return '#db2777'; // Evening
    };

    return (
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                {/* Daypart Top Banner */}
                <g opacity="0.9">
                    <rect x={xPadLeft} y="20" width={stepX * 6} height="20" fill="#4f46e5" rx="3" />
                    <text x={xPadLeft + (stepX * 3)} y="34" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">🌙 Night</text>

                    <rect x={xPadLeft + stepX * 6} y="20" width={stepX * 6} height="20" fill="#f59e0b" rx="3" />
                    <text x={xPadLeft + (stepX * 9)} y="34" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">🌅 Morning</text>

                    <rect x={xPadLeft + stepX * 12} y="20" width={stepX * 6} height="20" fill="#0284c7" rx="3" />
                    <text x={xPadLeft + (stepX * 15)} y="34" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">☀️ Afternoon</text>

                    <rect x={xPadLeft + stepX * 18} y="20" width={stepX * 6} height="20" fill="#db2777" rx="3" />
                    <text x={xPadLeft + (stepX * 21)} y="34" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">🌆 Evening</text>
                </g>

                {/* 24 Hour Bars */}
                {buckets.map((b) => {
                    const cx = xPadLeft + (b.hour * stepX) + (stepX / 2);
                    const bx = cx - (colW / 2);
                    const barH = maxVal > 0 ? (b.val / maxVal) * plotH : 0;
                    const by = baselineY - barH;
                    const color = getDaypartColor(b.hour);

                    return (
                        <g key={b.hour}>
                            <rect
                                x={bx}
                                y={by}
                                width={colW}
                                height={barH}
                                rx="3"
                                fill={color}
                                opacity={hoveredBucket && hoveredBucket.hour !== b.hour ? 0.4 : 0.85}
                                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                                onMouseEnter={(e) => {
                                    setHoveredBucket(b);
                                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                    if (rect) {
                                        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 12 });
                                    }
                                }}
                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                    if (rect) {
                                        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 12 });
                                    }
                                }}
                                onMouseLeave={() => setHoveredBucket(null)}
                            />

                            {/* Hour Labels every 3 hours */}
                            {b.hour % 3 === 0 && (
                                <text
                                    x={cx}
                                    y={h - 14}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fontWeight="600"
                                    fill="var(--text-muted)"
                                    fontFamily="JetBrains Mono, monospace"
                                >
                                    {b.hour === 0 ? '12A' : (b.hour === 12 ? '12P' : (b.hour > 12 ? `${b.hour - 12}P` : `${b.hour}A`))}
                                </text>
                            )}
                        </g>
                    );
                })}

                <line x1={xPadLeft} y1={baselineY} x2={w - xPadRight} y2={baselineY} stroke="var(--border-color)" strokeWidth="1" />
            </svg>

            {/* Localized Bar Tooltip */}
            {hoveredBucket && tooltipPos && (
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
                    transform: 'translate(-50%, -100%)',
                    whiteSpace: 'nowrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '11px', fontWeight: 700, color: '#f59e0b' }}>
                        <span>
                            {hoveredBucket.hour === 0 ? '12 AM' : (hoveredBucket.hour === 12 ? '12 PM' : (hoveredBucket.hour > 12 ? `${hoveredBucket.hour - 12} PM` : `${hoveredBucket.hour} AM`))} – 
                            {((hoveredBucket.hour + 1) % 24) === 0 ? '12 AM' : (((hoveredBucket.hour + 1) % 24) === 12 ? '12 PM' : (((hoveredBucket.hour + 1) % 24) > 12 ? `${((hoveredBucket.hour + 1) % 24) - 12} PM` : `${(hoveredBucket.hour + 1) % 24} AM`))}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{hoveredBucket.daypart}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        {hoveredBucket.formatted}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                        {hoveredBucket.count} logged session{hoveredBucket.count === 1 ? '' : 's'}
                    </div>
                </div>
            )}
        </div>
    );
};
