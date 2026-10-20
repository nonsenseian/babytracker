import React, { useState } from 'react';
import type { DailyAggregate } from '../../types/analytics';
import { ML_PER_OZ } from '../../engines/guardrails';

interface SplineChartProps {
    dailyData: DailyAggregate[];
    metric: string;
    isOz: boolean;
}

export const SplineChart: React.FC<SplineChartProps> = ({ dailyData, metric, isOz }) => {
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
    const stepX = count > 1 ? plotW / (count - 1) : plotW;

    const points = dailyData.map((d, i) => {
        const x = xPadLeft + (i * stepX);
        const y = maxVal > 0 ? (yPadTop + plotH) - ((d.val / maxVal) * plotH) : baselineY;
        return { x, y, data: d };
    });

    let pathD = '';
    if (points.length > 0) {
        pathD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(i - 1, 0)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(i + 2, points.length - 1)];

            const cp1x = p1.x + (p2.x - p0.x) / 6.0;
            const cp1y = p1.y + (p2.y - p0.y) / 6.0;
            const cp2x = p2.x - (p3.x - p1.x) / 6.0;
            const cp2y = p2.y - (p3.y - p1.y) / 6.0;

            pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        }
    }

    const lastX = points.length > 0 ? points[points.length - 1].x : w - xPadRight;
    const firstX = points.length > 0 ? points[0].x : xPadLeft;
    const areaD = pathD ? `${pathD} L ${lastX.toFixed(1)} ${baselineY.toFixed(1)} L ${firstX.toFixed(1)} ${baselineY.toFixed(1)} Z` : '';

    const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

    const formatYLabel = (num: number) => {
        if (metric === 'feeding' || metric === 'pumping') return isOz ? `${(num / ML_PER_OZ).toFixed(0)}oz` : `${num}`;
        if (metric === 'sleep') return `${num}h`;
        if (metric === 'growth') return `${(num * 2.2).toFixed(0)}lb`;
        return `${num}`;
    };

    return (
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            <svg
                viewBox={`0 0 ${w} ${h}`}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const mouseX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                    const svgX = (mouseX / rect.width) * w;
                    let closest = Math.round((svgX - xPadLeft) / stepX);
                    closest = Math.max(0, Math.min(count - 1, closest));
                    setHoveredIdx(closest);
                }}
                onMouseLeave={() => setHoveredIdx(null)}
            >
                <defs>
                    <linearGradient id="splineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.38" />
                        <stop offset="70%" stopColor="#fb7185" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                    const y = baselineY - (f * plotH);
                    const labelVal = Math.round(f * maxVal);
                    return (
                        <g key={f}>
                            <line x1={xPadLeft} y1={y} x2={w - xPadRight} y2={y} stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="1" />
                            <text x={xPadLeft - 8} y={y + 3.5} textAnchor="end" fontSize="10" fontWeight="600" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">
                                {formatYLabel(labelVal)}
                            </text>
                        </g>
                    );
                })}

                {/* WHO Growth Percentile Reference Curves */}
                {metric === 'growth' && (
                    <g opacity="0.75">
                        <line x1={xPadLeft} y1={baselineY - ((4.8 / maxVal) * plotH)} x2={w - xPadRight} y2={baselineY - ((4.8 / maxVal) * plotH)} stroke="#10b981" strokeDasharray="5,5" strokeWidth="2" />
                        <text x={w - xPadRight - 5} y={baselineY - ((4.8 / maxVal) * plotH) - 4} textAnchor="end" fontSize="9" fontWeight="700" fill="#10b981">WHO 50th (Median)</text>
                    </g>
                )}

                {/* Area and Curve */}
                {areaD && <path d={areaD} fill="url(#splineGradient)" />}
                {pathD && <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                {/* Data Points */}
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                ))}

                {/* X Axis Labels */}
                {points.map((p, i) => {
                    if (i % 2 === 0 || i === count - 1) {
                        return (
                            <text key={i} x={p.x} y={h - 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">
                                {p.data.label}
                            </text>
                        );
                    }
                    return null;
                })}

                {/* Crosshair on hover */}
                {hoveredPoint && (
                    <g>
                        <line x1={hoveredPoint.x} y1={yPadTop} x2={hoveredPoint.x} y2={baselineY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2,2" />
                        <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                    </g>
                )}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
                <div style={{
                    position: 'absolute',
                    left: `${(hoveredPoint.x / w) * 100}%`,
                    top: '60px',
                    pointerEvents: 'none',
                    zIndex: 20,
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap'
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>
                        {hoveredPoint.data.dateStr}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        {metric === 'feeding' || metric === 'pumping'
                            ? (isOz ? `${(hoveredPoint.data.val / ML_PER_OZ).toFixed(1)} oz` : `${Math.round(hoveredPoint.data.val)} mL`)
                            : (metric === 'sleep' ? `${hoveredPoint.data.val.toFixed(1)} hrs` : (metric === 'growth' ? `${(hoveredPoint.data.val * 2.20462).toFixed(1)} lbs` : `${Math.round(hoveredPoint.data.val)}`))}
                    </div>
                </div>
            )}
        </div>
    );
};
