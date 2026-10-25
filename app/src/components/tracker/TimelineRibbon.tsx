import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ActivityLog } from '../../types/log';
import { Clock, Sun, Moon } from 'lucide-react';

export const TimelineRibbon: React.FC = () => {
    const { logs, selectedDate, unit } = useApp();
    const [hoveredLog, setHoveredLog] = useState<{ log: ActivityLog; x: number; y: number } | null>(null);

    const activeDate = selectedDate || new Date().toISOString().split('T')[0];

    // Filter logs for selected date
    const dayLogs = logs.filter(l => l.dateStr === activeDate);

    // Clock center & radii (viewBox 340 x 340)
    const CX = 170;
    const CY = 170;
    const R_OUTER = 130;
    const R_INNER = 84;
    const R_TRACK = (R_OUTER + R_INNER) / 2; // 107px

    // Convert minutes into clockwise angle in degrees (0° = 12:00 AM at North / Top)
    const getAngleDegrees = (timestamp: number) => {
        const d = new Date(timestamp);
        const mins = d.getHours() * 60 + d.getMinutes();
        return (mins / 1440) * 360;
    };

    // Calculate Cartesian coordinates from angle (degrees) and radius
    const getCoordinates = (angleDeg: number, radius: number) => {
        const angleRad = (angleDeg - 90) * (Math.PI / 180);
        return {
            x: CX + radius * Math.cos(angleRad),
            y: CY + radius * Math.sin(angleRad)
        };
    };

    const getMarkerColor = (l: ActivityLog) => {
        if (l.category === 'feeding') {
            return l.subType === 'breastmilk' ? '#f43f5e' : '#38bdf8';
        }
        if (l.category === 'pumping') return '#a855f7';
        if (l.category === 'diaper') {
            return l.subType === 'poop' ? '#b45309' : '#f59e0b';
        }
        if (l.category === 'sleep') return '#6366f1';
        if (l.category === 'bath') return '#06b6d4';
        if (l.category === 'other') return '#8b5cf6';
        return '#10b981';
    };

    const getMarkerEmoji = (l: ActivityLog) => {
        if (l.category === 'feeding') {
            return l.subType === 'breastmilk' ? '🤱' : '🍼';
        }
        if (l.category === 'pumping') return '🥛';
        if (l.category === 'diaper') {
            return l.subType === 'poop' ? '💩' : '🟡';
        }
        if (l.category === 'sleep') return '😴';
        if (l.category === 'tummy') return '🐢';
        if (l.category === 'bath') return '🛁';
        if (l.category === 'other') return '📝';
        return '⭐';
    };

    const formatDisplayDateHeader = (dateStr: string | null) => {
        if (!dateStr) return 'Today';
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Current time indicator for today
    const isToday = !selectedDate || selectedDate === new Date().toISOString().split('T')[0];
    const nowAngle = getAngleDegrees(Date.now());
    const nowPos = getCoordinates(nowAngle, R_OUTER);

    // 24 hour tick marks and key labels
    const hourTicks = Array.from({ length: 24 }, (_, i) => i);
    const keyHourLabels = [
        { hour: 0, label: '12a' },
        { hour: 3, label: '3a' },
        { hour: 6, label: '6a' },
        { hour: 9, label: '9a' },
        { hour: 12, label: '12p' },
        { hour: 15, label: '3p' },
        { hour: 18, label: '6p' },
        { hour: 21, label: '9p' }
    ];

    return (
        <section id="timeline-circular-clock-card" className="surface-card" style={{ marginBottom: '24px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} style={{ color: 'var(--text-muted)' }} />
                    <h3 style={{
                        fontSize: '13px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--text-primary)',
                        margin: 0
                    }}>
                        24-Hour Day Clock Ribbon
                    </h3>
                    <span style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'var(--bg-surface-elevated)'
                    }}>
                        {formatDisplayDateHeader(selectedDate)}
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-muted)'
                }}>
                    <span id="timeline-legend-day" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Sun size={13} style={{ color: '#eab308' }} /> Daytime
                    </span>
                    <span id="timeline-legend-night" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Moon size={13} style={{ color: '#60a5fa' }} /> Nighttime
                    </span>
                </div>
            </div>

            {/* Circular 24-Hour Clock Container */}
            <div style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '8px 0',
                width: '100%',
                userSelect: 'none'
            }}>
                <svg
                    id="timeline-clock-dial"
                    viewBox="0 0 340 340"
                    style={{
                        width: '100%',
                        maxWidth: '340px',
                        height: 'auto',
                        overflow: 'visible'
                    }}
                >
                    <defs>
                        {/* Soft translucent gradients for day (yellow) & night (navy blue) */}
                        <linearGradient id="dayHemisphereGradient" x1="0%" y1="50%" x2="100%" y2="50%">
                            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#fde047" stopOpacity="0.14" />
                        </linearGradient>

                        <linearGradient id="nightHemisphereGradient" x1="0%" y1="50%" x2="100%" y2="50%">
                            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.32" />
                        </linearGradient>

                        <radialGradient id="centerDialGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="var(--bg-surface-elevated)" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="var(--bg-surface)" stopOpacity="1" />
                        </radialGradient>
                    </defs>

                    {/* Outer Dial Base Background Ring */}
                    <circle
                        cx={CX}
                        cy={CY}
                        r={R_OUTER}
                        fill="var(--bg-surface-elevated)"
                        stroke="var(--border-color)"
                        strokeWidth="1.5"
                    />

                    {/* Left Hemisphere: Daytime (Light Yellow, semi-transparent) */}
                    {/* Sweeps clockwise from Bottom (180°) through Left (270°) to Top (0° / 360°) */}
                    <path
                        d={`M ${CX} ${CY - R_OUTER}
                            A ${R_OUTER} ${R_OUTER} 0 0 0 ${CX} ${CY + R_OUTER}
                            L ${CX} ${CY + R_INNER}
                            A ${R_INNER} ${R_INNER} 0 0 1 ${CX} ${CY - R_INNER}
                            Z`}
                        fill="url(#dayHemisphereGradient)"
                    />

                    {/* Right Hemisphere: Nighttime (Dark Blue, semi-transparent) */}
                    {/* Sweeps clockwise from Top (0°) through Right (90°) to Bottom (180°) */}
                    <path
                        d={`M ${CX} ${CY - R_OUTER}
                            A ${R_OUTER} ${R_OUTER} 0 0 1 ${CX} ${CY + R_OUTER}
                            L ${CX} ${CY + R_INNER}
                            A ${R_INNER} ${R_INNER} 0 0 0 ${CX} ${CY - R_INNER}
                            Z`}
                        fill="url(#nightHemisphereGradient)"
                    />

                    {/* Subtle Hemisphere Divider Axis (Vertical line through center) */}
                    <line
                        x1={CX}
                        y1={CY - R_OUTER}
                        x2={CX}
                        y2={CY - R_INNER}
                        stroke="var(--border-color)"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        opacity="0.75"
                    />
                    <line
                        x1={CX}
                        y1={CY + R_INNER}
                        x2={CX}
                        y2={CY + R_OUTER}
                        stroke="var(--border-color)"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        opacity="0.75"
                    />

                    {/* Circular Baseline Guideline along the Activity Track */}
                    <circle
                        cx={CX}
                        cy={CY}
                        r={R_TRACK}
                        fill="none"
                        stroke="var(--border-color)"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                        opacity="0.6"
                    />

                    {/* 24 Hour Radial Ticks */}
                    {hourTicks.map(hour => {
                        const angle = (hour / 24) * 360;
                        const isMajor = hour % 3 === 0;
                        const p1 = getCoordinates(angle, R_OUTER);
                        const p2 = getCoordinates(angle, R_OUTER - (isMajor ? 7 : 4));
                        return (
                            <line
                                key={`tick-${hour}`}
                                x1={p1.x}
                                y1={p1.y}
                                x2={p2.x}
                                y2={p2.y}
                                stroke="var(--text-muted)"
                                strokeWidth={isMajor ? 1.5 : 0.8}
                                opacity={isMajor ? 0.75 : 0.4}
                            />
                        );
                    })}

                    {/* Major Hour Labels around Clock Perimeter */}
                    {keyHourLabels.map(({ hour, label }) => {
                        const angle = (hour / 24) * 360;
                        const pos = getCoordinates(angle, R_OUTER + 15);
                        return (
                            <text
                                key={`label-${hour}`}
                                x={pos.x}
                                y={pos.y + 3}
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="800"
                                fontFamily="JetBrains Mono, monospace"
                                fill="var(--text-muted)"
                                opacity="0.9"
                            >
                                {label}
                            </text>
                        );
                    })}

                    {/* Center Dial Hub: Clean Card Background */}
                    <circle
                        cx={CX}
                        cy={CY}
                        r={R_INNER}
                        fill="url(#centerDialGlow)"
                        stroke="var(--border-color)"
                        strokeWidth="1.5"
                    />

                    {/* Center Content: Activities Summary */}
                    <text
                        x={CX}
                        y={CY - 14}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        letterSpacing="0.05em"
                        fill="var(--text-muted)"
                    >
                        ACTIVITIES
                    </text>
                    <text
                        id="timeline-dial-activity-count"
                        x={CX}
                        y={CY + 12}
                        textAnchor="middle"
                        fontSize="22"
                        fontWeight="900"
                        fontFamily="JetBrains Mono, monospace"
                        fill="var(--text-primary)"
                    >
                        {dayLogs.length}
                    </text>
                    <text
                        x={CX}
                        y={CY + 28}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="700"
                        fill="var(--text-secondary)"
                    >
                        {isToday ? 'LOGGED TODAY' : 'ON THIS DATE'}
                    </text>

                    {/* Today Live Needle Indicator */}
                    {isToday && (
                        <g opacity="0.85">
                            <line
                                x1={CX}
                                y1={CY}
                                x2={nowPos.x}
                                y2={nowPos.y}
                                stroke="#f59e0b"
                                strokeWidth="1.5"
                                strokeDasharray="4,2"
                            />
                            <circle
                                cx={nowPos.x}
                                cy={nowPos.y}
                                r="4"
                                fill="#f59e0b"
                                stroke="#fff"
                                strokeWidth="1.5"
                            />
                        </g>
                    )}

                    {/* Plotted Activity Markers */}
                    {dayLogs.map(log => {
                        const angle = getAngleDegrees(log.timestamp);
                        const pos = getCoordinates(angle, R_TRACK);
                        const color = getMarkerColor(log);
                        const emoji = getMarkerEmoji(log);

                        return (
                            <g
                                key={log.id}
                                transform={`translate(${pos.x}, ${pos.y})`}
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={() => setHoveredLog({ log, x: pos.x, y: pos.y })}
                                onMouseLeave={() => setHoveredLog(null)}
                                onClick={() => setHoveredLog({ log, x: pos.x, y: pos.y })}
                            >
                                {/* Glow Halo */}
                                <circle
                                    r="13"
                                    fill={color}
                                    fillOpacity="0.22"
                                />
                                {/* Marker Circle */}
                                <circle
                                    r="11"
                                    fill="var(--bg-surface)"
                                    stroke={color}
                                    strokeWidth="2"
                                />
                                {/* Emoji Text */}
                                <text
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize="12"
                                >
                                    {emoji}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Interactive Tooltip Popover */}
                {hoveredLog && (
                    <div
                        style={{
                            position: 'absolute',
                            left: `${(hoveredLog.x / 340) * 100}%`,
                            top: `${(hoveredLog.y / 340) * 100}%`,
                            transform: 'translate(-50%, -125%)',
                            backgroundColor: 'var(--bg-surface-elevated, #1e293b)',
                            color: 'var(--text-primary, #ffffff)',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            zIndex: 100,
                            whiteSpace: 'nowrap',
                            fontSize: '11px',
                            pointerEvents: 'none',
                            animation: 'fadeIn 0.15s ease'
                        }}
                    >
                        <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{getMarkerEmoji(hoveredLog.log)}</span>
                            <span style={{ textTransform: 'capitalize' }}>
                                {hoveredLog.log.category} {hoveredLog.log.subType ? `(${hoveredLog.log.subType})` : ''}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>• {hoveredLog.log.timeStr}</span>
                        </div>
                        {hoveredLog.log.amountMl && (
                            <div style={{ color: '#0284c7', marginTop: '2px', fontWeight: 700 }}>
                                {hoveredLog.log.amountMl} {unit}
                            </div>
                        )}
                        {hoveredLog.log.durationMinutes && (
                            <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                                Duration: {hoveredLog.log.durationMinutes} min
                            </div>
                        )}
                        {hoveredLog.log.notes && (
                            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                "{hoveredLog.log.notes}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '8px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-color)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)'
            }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                    <span>Formula</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
                    <span>Breastmilk</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7' }} />
                    <span>Pump (🥛)</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                    <span>Pee (🟡)</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#b45309' }} />
                    <span>Poop (💩)</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
                    <span>Sleep</span>
                </span>
            </div>
        </section>
    );
};
