import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ActivityLog } from '../../types/log';
import { Clock } from 'lucide-react';

export const TimelineRibbon: React.FC = () => {
    const { logs, selectedDate, unit } = useApp();
    const [hoveredLog, setHoveredLog] = useState<{ log: ActivityLog; x: number } | null>(null);

    const activeDate = selectedDate || new Date().toISOString().split('T')[0];

    // Filter logs for selected date
    const dayLogs = logs.filter(l => l.dateStr === activeDate);

    // Convert log timestamp to percentage across 24h (0% at 12:00 AM, 100% at 11:59 PM)
    const getPercentOfDay = (timestamp: number) => {
        const d = new Date(timestamp);
        const mins = d.getHours() * 60 + d.getMinutes();
        return Math.min(98, Math.max(2, (mins / 1440) * 100));
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

    return (
        <section className="surface-card" style={{ marginBottom: '24px' }}>
            {/* Header (Matches Image 2) */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px'
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
                        24-Hour Day Timeline Ribbon
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

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    12 AM — 11:59 PM
                </div>
            </div>

            {/* Visual 24-Hour Track Ribbon */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '48px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'visible',
                    userSelect: 'none'
                }}
            >
                {/* Hour Ticks and Labels: 12a, 3a, 6a, 9a, 12p, 3p, 6p, 9p, 12a */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'var(--text-muted)',
                    opacity: 0.7
                }}>
                    <span>12a</span>
                    <span>3a</span>
                    <span>6a</span>
                    <span>9a</span>
                    <span>12p</span>
                    <span>3p</span>
                    <span>6p</span>
                    <span>9p</span>
                    <span>12a</span>
                </div>

                {/* Subtle horizontal baseline */}
                <div style={{
                    position: 'absolute',
                    left: '8px',
                    right: '8px',
                    height: '2px',
                    backgroundColor: 'var(--border-color)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1
                }} />

                {/* Plotted Activity Markers */}
                {dayLogs.map((log) => {
                    const pct = getPercentOfDay(log.timestamp);
                    const color = getMarkerColor(log);
                    const emoji = getMarkerEmoji(log);

                    return (
                        <div
                            key={log.id}
                            onMouseEnter={() => setHoveredLog({ log, x: pct })}
                            onMouseLeave={() => setHoveredLog(null)}
                            onClick={() => setHoveredLog({ log, x: pct })}
                            style={{
                                position: 'absolute',
                                left: `${pct}%`,
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 10,
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                            }}
                        >
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--bg-surface)',
                                border: `2px solid ${color}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}>
                                {emoji}
                            </div>
                        </div>
                    );
                })}

                {/* Interactive Tooltip Popover */}
                {hoveredLog && (
                    <div
                        style={{
                            position: 'absolute',
                            left: `${hoveredLog.x}%`,
                            bottom: '115%',
                            transform: 'translateX(-50%)',
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

            {/* Legend (Matches Image 2) */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '14px',
                marginTop: '12px',
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
