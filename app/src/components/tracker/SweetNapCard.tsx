import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateSweetNapPrediction, type SweetNapResult } from '../../engines/sweetNapEngine';
import { Moon, Play, Pause, Square, Plus, Clock, Sparkles, ShieldCheck, Info } from 'lucide-react';

interface SweetNapCardProps {
    onStartNapTimer?: () => void;
    onPauseNapTimer?: () => void;
    onStopNapTimer?: () => void;
    onLogNapModal?: () => void;
}

export const SweetNapCard: React.FC<SweetNapCardProps> = ({
    onStartNapTimer,
    onPauseNapTimer,
    onStopNapTimer,
    onLogNapModal
}) => {
    const { activeChild, logs, timers, startTimer, pauseTimer } = useApp();
    const [now, setNow] = useState<number>(Date.now());
    const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);

    // Update every 30 seconds for live ticking
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const prediction: SweetNapResult = calculateSweetNapPrediction({
        birthDateStr: activeChild?.birthDate || '',
        logs,
        isSleepingNow: timers.sleep.isRunning,
        sleepStartTime: timers.sleep.startTime,
        now
    });

    const formatClockTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const handleStartNap = () => {
        if (onStartNapTimer) {
            onStartNapTimer();
        } else {
            startTimer('sleep');
        }
    };

    const handlePauseNap = () => {
        if (onPauseNapTimer) {
            onPauseNapTimer();
        } else {
            pauseTimer('sleep');
        }
    };

    const handleStopNap = () => {
        if (onStopNapTimer) {
            onStopNapTimer();
        } else {
            pauseTimer('sleep');
        }
    };

    // Pressure bar indicator position (clamped 0 to 100%)
    const clampedPressure = Math.min(100, Math.max(0, prediction.sleepPressurePercent));

    return (
        <div
            id="sweet-nap-card"
            className="surface-card"
            style={{
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: '20px',
                position: 'relative'
            }}
        >
            {/* Header: Title, Age Bracket Pill, Sleep Status Badge */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '14px'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            backgroundColor: prediction.isSleepingNow ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                            color: prediction.isSleepingNow ? '#8b5cf6' : '#3b82f6',
                            marginTop: '2px'
                        }}
                    >
                        <Moon size={18} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '15px',
                                fontWeight: 800,
                                letterSpacing: '-0.01em',
                                color: 'var(--text-primary)'
                            }}>
                                Nap Predictor
                            </h3>
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                <button
                                    type="button"
                                    id="btn-nap-info-disclaimer"
                                    onClick={() => setShowDisclaimer(!showDisclaimer)}
                                    onMouseEnter={() => setShowDisclaimer(true)}
                                    onMouseLeave={() => setShowDisclaimer(false)}
                                    aria-label="Nap Predictor Estimation Source & Disclaimer"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '2px',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%'
                                    }}
                                >
                                    <Info size={15} />
                                </button>
                                {showDisclaimer && (
                                    <div
                                        id="nap-predictor-disclaimer-tooltip"
                                        role="tooltip"
                                        style={{
                                            position: 'absolute',
                                            top: '125%',
                                            left: 0,
                                            zIndex: 60,
                                            width: '260px',
                                            padding: '10px 12px',
                                            borderRadius: '10px',
                                            backgroundColor: 'var(--bg-surface-elevated, #1e293b)',
                                            color: 'var(--text-primary, #ffffff)',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                                            fontSize: '11px',
                                            lineHeight: '1.45',
                                            pointerEvents: 'none'
                                        }}
                                    >
                                        <strong>Source & Clinical Basis:</strong> Wake window estimates are derived from American Academy of Pediatrics (AAP) age-indexed guidelines and dynamically calibrated by preceding nap duration.
                                    </div>
                                )}
                            </div>
                        </div>
                        <p style={{
                            margin: '3px 0 0 0',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'var(--text-muted)'
                        }}>
                            Age: {prediction.ageWeeks} Wks • {prediction.ageBracketLabel} ({prediction.expectedNapsPerDay})
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: `${prediction.statusColor}18`,
                    color: prediction.statusColor,
                    border: `1px solid ${prediction.statusColor}35`,
                    marginTop: '2px',
                    alignSelf: 'flex-start'
                }}>
                    <span
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: prediction.statusColor,
                            display: 'inline-block'
                        }}
                    />
                    <span>{prediction.statusLabel}</span>
                </div>
            </div>

            {/* Main Sleep Prediction Block */}
            <div
                style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '14px'
                }}
            >
                {prediction.isSleepingNow ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#8b5cf6', letterSpacing: '0.04em' }}>
                            Currently Napping 💤
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
                            {Math.floor((prediction.currentSleepElapsedMinutes || 0) / 60)}h{' '}
                            {(prediction.currentSleepElapsedMinutes || 0) % 60}m Elapsed
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Live nap timer is running. Wake window prediction will automatically recalculate upon waking.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Target Nap Window and Countdown */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }}>
                            <div>
                                <span style={{
                                    display: 'block',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    color: 'var(--text-muted)',
                                    marginBottom: '3px'
                                }}>
                                    Next Nap SweetSpot Window
                                </span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                                        {formatClockTime(prediction.targetNapStartTime)} – {formatClockTime(prediction.targetNapEndTime)}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            color: prediction.statusColor
                                        }}
                                    >
                                        {prediction.minutesUntilTarget > 0
                                            ? `(in ~${prediction.minutesUntilTarget} mins)`
                                            : prediction.minutesUntilTarget >= -20
                                            ? `(Active SweetSpot Window!)`
                                            : `(Overdue by ${Math.abs(prediction.minutesUntilTarget)} mins)`}
                                    </span>
                                </div>
                            </div>

                            {/* Wake metrics pill */}
                            <div
                                style={{
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '10px',
                                    padding: '6px 12px',
                                    textAlign: 'right',
                                    flexShrink: 0
                                }}
                            >
                                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                    Awake Duration
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)' }}>
                                    {Math.floor(prediction.awakeElapsedMinutes / 60)}h {prediction.awakeElapsedMinutes % 60}m
                                    <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '4px' }}>
                                        / {prediction.effectiveWakeWindowMinutes}m target
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Visual Sleep Pressure Gauge */}
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: 'var(--text-secondary)',
                                marginBottom: '6px'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Sparkles size={13} style={{ color: 'var(--primary-accent)' }} />
                                    <span>Sleep Pressure Gauge</span>
                                </span>
                                <span style={{ fontWeight: 800 }}>{clampedPressure}%</span>
                            </div>

                            {/* Gradient Track */}
                            <div
                                style={{
                                    width: '100%',
                                    height: '10px',
                                    borderRadius: '999px',
                                    position: 'relative',
                                    background: 'linear-gradient(to right, #10b981 0%, #10b981 45%, #f59e0b 70%, #3b82f6 85%, #ef4444 100%)',
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.18)',
                                    marginBottom: '6px'
                                }}
                            >
                                {/* Marker pointer for current wake position */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '-2px',
                                        bottom: '-2px',
                                        width: '14px',
                                        borderRadius: '999px',
                                        backgroundColor: '#ffffff',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                                        border: '2px solid #1e293b',
                                        left: `calc(${clampedPressure}% - 7px)`,
                                        transition: 'left 0.4s ease'
                                    }}
                                    title={`Current Wake Pressure: ${clampedPressure}%`}
                                />
                            </div>

                            {/* Gauge Key Labels */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                color: 'var(--text-muted)'
                            }}>
                                <span>Rested</span>
                                <span>Wind Down</span>
                                <span style={{ color: '#3b82f6' }}>SweetSpot</span>
                                <span style={{ color: '#ef4444' }}>Overtired</span>
                            </div>
                        </div>

                        {/* Status Advice Subtext */}
                        <p style={{
                            margin: 0,
                            fontSize: '12px',
                            lineHeight: '1.45',
                            color: 'var(--text-secondary)'
                        }}>
                            {prediction.statusSubtext}
                        </p>

                        {/* Adjustment Notice (Short / Long Nap Adaptive Pill) */}
                        {prediction.adjustmentNotice && (
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                    color: '#3b82f6',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    alignSelf: 'flex-start'
                                }}
                            >
                                <Clock size={12} />
                                <span>{prediction.adjustmentNotice}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Actions Row: Start Nap Stopwatch & Log Nap Entry */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-muted)'
                }}>
                    <ShieldCheck size={14} style={{ color: '#10b981' }} />
                    <span>AAP Age-Indexed Heuristics</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {timers.sleep.isRunning ? (
                        <>
                            <button
                                type="button"
                                onClick={handlePauseNap}
                                className="btn-ghost"
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                <Pause size={13} fill="currentColor" />
                                <span>Pause</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleStopNap}
                                className="btn-primary"
                                id="btn-stop-sleep-timer"
                                style={{
                                    padding: '7px 16px',
                                    fontSize: '12px',
                                    backgroundColor: '#ef4444',
                                    borderColor: '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Square size={12} fill="currentColor" />
                                <span>Stop Sleep Timer</span>
                            </button>
                        </>
                    ) : timers.sleep.elapsedSeconds > 0 ? (
                        <>
                            <button
                                type="button"
                                onClick={handleStartNap}
                                className="btn-ghost"
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                <Play size={13} fill="currentColor" />
                                <span>Resume</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleStopNap}
                                className="btn-primary"
                                id="btn-stop-sleep-timer"
                                style={{
                                    padding: '7px 16px',
                                    fontSize: '12px',
                                    backgroundColor: '#ef4444',
                                    borderColor: '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Square size={12} fill="currentColor" />
                                <span>Stop Sleep Timer</span>
                            </button>
                        </>
                    ) : (
                        <>
                            {onLogNapModal && (
                                <button
                                    type="button"
                                    onClick={onLogNapModal}
                                    className="btn-ghost"
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '12px'
                                    }}
                                >
                                    <Plus size={13} />
                                    <span>Log Past Nap</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleStartNap}
                                className="btn-primary"
                                id="btn-start-sleep-timer"
                                style={{
                                    padding: '7px 16px',
                                    fontSize: '12px',
                                    backgroundColor: 'var(--primary-accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Play size={13} fill="currentColor" />
                                <span>Start Nap Timer</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
