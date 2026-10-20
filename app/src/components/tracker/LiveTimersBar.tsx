import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ThemeIcon } from '../common/ThemeIcon';
import { Play, Pause, Save, RotateCcw, Pencil, X, Plus, ChevronLeft, ChevronRight, GripHorizontal } from 'lucide-react';
import { SoundEngine } from '../../engines/soundMachine';
import { VoiceAssistant } from '../../engines/voiceEngine';
import { getBabyAgeWeeks } from '../../engines/sweetNapEngine';
import type { TimersState } from '../../types/state';

export function getRecommendedFeedIntervalHours(ageWeeks: number): number {
    if (ageWeeks < 4) return 2.0;       // Newborn (0-4 wks): Strict 2.0h
    if (ageWeeks < 12) return 2.5;      // 1-3 months (4-12 wks): 2.5h
    if (ageWeeks < 24) return 3.0;      // 3-6 months (12-24 wks): 3.0h
    return 3.5;                         // 6+ months (24+ wks): 3.5h
}

interface LiveTimersBarProps {
    onLogTimer: (type: keyof TimersState, elapsedMinutes: number, meta?: any) => void;
    onEditTimer?: (type: keyof TimersState, elapsedMinutes: number, meta?: any) => void;
}

interface PendingTimerSave {
    type: keyof TimersState;
    title: string;
    subtitle: string;
    color: string;
    icon: string;
    elapsedMinutes: number;
    meta?: any;
    isFading: boolean;
}

// Unified Muted Semantic Timer Button Colors (Calm, non-distracting palette)
const TIMER_BTN_START = '#16a34a'; // Muted Green for Start (Play)
const TIMER_BTN_PAUSE = '#ca8a04'; // Muted Warm Yellow/Amber for Pause
const TIMER_BTN_SAVE = '#2563eb';  // Muted Slate Blue for Save

// Unified Timer Box Border & Glow Styling (Identical across all timer cards)
const getTimerBoxStyle = (isRunning: boolean): React.CSSProperties => ({
    padding: '10px 12px',
    borderRadius: '12px',
    border: isRunning ? '1.5px solid var(--primary-accent, #0284c7)' : '1px solid var(--border-color)',
    boxShadow: isRunning ? '0 0 12px rgba(2, 132, 199, 0.22), 0 2px 8px rgba(0, 0, 0, 0.04)' : 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 'unset',
    height: '100%',
    transition: 'all 0.25s ease'
});

export const LiveTimersBar: React.FC<LiveTimersBarProps> = ({ onLogTimer, onEditTimer }) => {
    const { timers, startTimer, pauseTimer, resetTimer, settings, updateSettings, logs, activeChild } = useApp();

    // Customizable item order and hidden timers for layout customization mode
    const timerOrder = settings.timerOrder && settings.timerOrder.length > 0
        ? settings.timerOrder
        : ['feed', 'pump', 'sleep', 'tummy'];
    const hiddenTimerIds = settings.hiddenTimerIds || [];
    const [draggedTimerId, setDraggedTimerId] = useState<string | null>(null);
    const [dragOverTimerId, setDragOverTimerId] = useState<string | null>(null);

    const moveTimerItem = (id: string, direction: 'left' | 'right') => {
        const currentList = [...timerOrder];
        const index = currentList.indexOf(id);
        if (index === -1) return;
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentList.length) return;
        const temp = currentList[index];
        currentList[index] = currentList[targetIndex];
        currentList[targetIndex] = temp;
        updateSettings({ timerOrder: currentList });
    };

    const handleDragStartTimer = (e: React.DragEvent, id: string) => {
        e.stopPropagation();
        setDraggedTimerId(id);
        e.dataTransfer.setData('application/x-timer-id', id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOverTimer = (e: React.DragEvent, targetId: string) => {
        if (settings.isLayoutEditMode) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            if (dragOverTimerId !== targetId) {
                setDragOverTimerId(targetId);
            }
        }
    };

    const handleDragLeaveTimer = (e: React.DragEvent) => {
        e.stopPropagation();
        setDragOverTimerId(null);
    };

    const handleDragEndTimer = (e: React.DragEvent) => {
        e.stopPropagation();
        setDraggedTimerId(null);
        setDragOverTimerId(null);
    };

    const handleDropTimer = (e: React.DragEvent, targetId: string) => {
        if (!settings.isLayoutEditMode) return;
        e.preventDefault();
        e.stopPropagation();
        const sourceId = e.dataTransfer.getData('application/x-timer-id') || e.dataTransfer.getData('text/plain') || draggedTimerId;
        setDraggedTimerId(null);
        setDragOverTimerId(null);
        if (!sourceId || sourceId === targetId) return;

        const currentList = [...timerOrder];
        const sourceIndex = currentList.indexOf(sourceId);
        const targetIndex = currentList.indexOf(targetId);
        if (sourceIndex === -1 || targetIndex === -1) return;

        currentList.splice(sourceIndex, 1);
        currentList.splice(targetIndex, 0, sourceId);
        updateSettings({ timerOrder: currentList });
    };

    const hideTimerItem = (id: string) => {
        if (!hiddenTimerIds.includes(id)) {
            updateSettings({ hiddenTimerIds: [...hiddenTimerIds, id] });
        }
    };

    const restoreTimerItem = (id: string) => {
        updateSettings({ hiddenTimerIds: hiddenTimerIds.filter(i => i !== id) });
    };

    // Unified Feed Timer Modes: Formula, Breastmilk, Nursing
    const [feedMode, setFeedMode] = useState<'formula' | 'breastmilk' | 'nursing'>('formula');
    const [nursingSide, setNursingSide] = useState<'left' | 'right'>('left');
    const [leftSeconds, setLeftSeconds] = useState<number>(0);
    const [rightSeconds, setRightSeconds] = useState<number>(0);

    // 5-second pending save popup state (identical to quick logging pad undo contract)
    const [pendingSave, setPendingSave] = useState<PendingTimerSave | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

    const lastNursingTickRef = useRef<number>(Date.now());

    useEffect(() => {
        lastNursingTickRef.current = Date.now();
    }, [nursingSide, timers.feed.isRunning]);

    // Live ticking for nursing L & R split with true Wall-Clock accuracy (persists across device lock)
    useEffect(() => {
        if (!timers.feed.isRunning || feedMode !== 'nursing') return;

        const updateNursingSplit = () => {
            const currentTime = Date.now();
            const deltaSec = Math.floor((currentTime - lastNursingTickRef.current) / 1000);
            if (deltaSec > 0) {
                lastNursingTickRef.current += deltaSec * 1000;
                if (nursingSide === 'left') {
                    setLeftSeconds(s => s + deltaSec);
                } else {
                    setRightSeconds(s => s + deltaSec);
                }
            }
        };

        const interval = setInterval(updateNursingSplit, 1000);
        document.addEventListener('visibilitychange', updateNursingSplit);
        window.addEventListener('focus', updateNursingSplit);
        window.addEventListener('pageshow', updateNursingSplit);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', updateNursingSplit);
            window.removeEventListener('focus', updateNursingSplit);
            window.removeEventListener('pageshow', updateNursingSplit);
        };
    }, [timers.feed.isRunning, feedMode, nursingSide]);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        };
    }, []);

    const [now, setNow] = useState<number>(Date.now());

    // Live ticking interval to update discard countdown second-by-second (with instant visibility change catch-up)
    useEffect(() => {
        const updateNow = () => setNow(Date.now());
        const interval = setInterval(updateNow, 1000);
        document.addEventListener('visibilitychange', updateNow);
        window.addEventListener('focus', updateNow);
        window.addEventListener('pageshow', updateNow);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', updateNow);
            window.removeEventListener('focus', updateNow);
            window.removeEventListener('pageshow', updateNow);
        };
    }, []);

    const formatTime = (secs: number) => {
        const safe = Number.isFinite(secs) ? Math.max(0, secs) : 0;
        const m = Math.floor(safe / 60);
        const s = safe % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // Calculate baby's age in weeks for dynamic pediatric feed interval windows
    const babyAgeWeeks = getBabyAgeWeeks(activeChild?.birthDate || '', now);
    const recommendedFeedInterval = getRecommendedFeedIntervalHours(babyAgeWeeks);

    // Dynamic feed interval:
    // If the user explicitly customized the feed interval away from default 3.0, or child is >= 12 weeks, use settings.feedIntervalHours.
    // If baby is a newborn (<4w) or young infant (4-12w) and setting is at 3.0, dynamically adapt to pediatric age window.
    const effectiveFeedIntervalHours = (settings.feedIntervalHours && (settings.feedIntervalHours !== 3.0 || babyAgeWeeks >= 12))
        ? settings.feedIntervalHours
        : recommendedFeedInterval;

    const pumpIntervalHours = settings.pumpIntervalHours || 3.0;

    // Find latest feed & pump logs
    const latestFeed = logs?.find(l => l.category === 'feeding' || (l.category as string) === 'nursing');
    const latestPump = logs?.find(l => l.category === 'pumping');

    // Feed reminder calculation: ANCHORED TO START OF FEED SESSION
    const feedStartTime = timers.feed.isRunning && timers.feed.startTime
        ? timers.feed.startTime
        : (latestFeed ? latestFeed.timestamp : null);

    const nextFeedTarget = feedStartTime
        ? (feedStartTime + (effectiveFeedIntervalHours * 3600 * 1000))
        : (now + (effectiveFeedIntervalHours * 3600 * 1000));

    const feedDiffMs = nextFeedTarget - now;
    const isFeedDue = feedDiffMs <= 0;

    // Pump reminder calculation: ANCHORED TO START OF PUMP SESSION
    const pumpStartTime = timers.pump.isRunning && timers.pump.startTime
        ? timers.pump.startTime
        : (latestPump ? latestPump.timestamp : null);

    const nextPumpTarget = pumpStartTime
        ? (pumpStartTime + (pumpIntervalHours * 3600 * 1000))
        : (now + (pumpIntervalHours * 3600 * 1000));

    const pumpDiffMs = nextPumpTarget - now;
    const isPumpDue = pumpDiffMs <= 0;

    const formatCountdownShort = (diffMs: number) => {
        if (diffMs <= 0) {
            const overdueMins = Math.floor(-diffMs / 60000);
            return overdueMins > 0 ? `+${overdueMins}m DUE` : 'DUE NOW';
        }
        const totalSecs = Math.floor(diffMs / 1000);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const formatRemainingBadge = (diffMs: number) => {
        if (diffMs <= 0) return 'DUE NOW';
        const totalSecs = Math.floor(diffMs / 1000);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        return hrs > 0 ? `in ${hrs}h ${mins}m` : `in ${mins}m`;
    };

    const notifiedFeedTargetRef = useRef<number | null>(null);
    const notifiedPumpTargetRef = useRef<number | null>(null);

    // Reset notification refs when switching active child
    useEffect(() => {
        notifiedFeedTargetRef.current = null;
        notifiedPumpTargetRef.current = null;
    }, [activeChild?.id]);

    // Automatic reminder chime & voice alerts
    useEffect(() => {
        if (isFeedDue && !timers.feed.isRunning && nextFeedTarget && notifiedFeedTargetRef.current !== nextFeedTarget) {
            notifiedFeedTargetRef.current = nextFeedTarget;
            if (settings.reminderChimes) {
                SoundEngine.playChime('reminder');
            }
            if (settings.voiceReminders) {
                setTimeout(() => {
                    VoiceAssistant.speak(`Friendly reminder: It's time to feed ${activeChild?.name || 'baby'}!`);
                }, 500);
            }
        }
    }, [isFeedDue, timers.feed.isRunning, nextFeedTarget, settings.reminderChimes, settings.voiceReminders, activeChild?.name]);

    useEffect(() => {
        if (isPumpDue && !timers.pump.isRunning && nextPumpTarget && notifiedPumpTargetRef.current !== nextPumpTarget) {
            notifiedPumpTargetRef.current = nextPumpTarget;
            if (settings.reminderChimes) {
                SoundEngine.playChime('reminder');
            }
            if (settings.voiceReminders) {
                setTimeout(() => {
                    VoiceAssistant.speak('Friendly reminder: Time for your scheduled pumping session.');
                }, 500);
            }
        }
    }, [isPumpDue, timers.pump.isRunning, nextPumpTarget, settings.reminderChimes, settings.voiceReminders]);

    const handleNursingToggle = (side: 'left' | 'right') => {
        setNursingSide(side);
        if (!timers.feed.isRunning) {
            startTimer('feed');
        }
    };

    const nursingTotalSeconds = leftSeconds + rightSeconds || timers.feed.elapsedSeconds;
    const feedDisplaySeconds = feedMode === 'nursing' ? nursingTotalSeconds : timers.feed.elapsedSeconds;

    // 1-Hour Milk Safety Discard Countdown (3600 seconds)
    // Anchored to the exact moment the bottle touches baby's mouth; runs INDEPENDENTLY of feed session pauses
    const DISCARD_TOTAL_SECONDS = 3600;
    const discardStartTime = timers.feed.discardMilkStartTime;
    const discardElapsed = discardStartTime ? Math.max(0, Math.floor((now - discardStartTime) / 1000)) : 0;
    const discardRemainingSeconds = discardStartTime ? Math.max(0, DISCARD_TOTAL_SECONDS - discardElapsed) : DISCARD_TOTAL_SECONDS;
    const isDiscardActive = discardStartTime !== null && discardRemainingSeconds > 0;
    const isDiscardExpired = discardStartTime !== null && discardRemainingSeconds <= 0;
    const formatDiscardTimer = (seconds: number) => {
        const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
        const m = Math.floor(safe / 60);
        const s = safe % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // Trigger Pending Save: Pauses timer immediately, holds elapsed time, initiates 5-second undo countdown
    const handleInitiateSave = (type: keyof TimersState) => {
        // 1. Immediately pause timer so it stops ticking up
        pauseTimer(type);

        // 2. Clear any active countdown
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

        let elapsedMinutes = 1;
        let title = '';
        let subtitle = '';
        let color = '#38bdf8';
        let icon = 'formula';
        let meta: any = undefined;

        if (type === 'feed') {
            const secs = feedMode === 'nursing' ? nursingTotalSeconds : timers.feed.elapsedSeconds;
            elapsedMinutes = Math.max(1, Math.round(secs / 60));
            if (feedMode === 'nursing') {
                title = 'Nursing Feed';
                subtitle = `${elapsedMinutes}m session (L: ${Math.round(leftSeconds / 60)}m, R: ${Math.round(rightSeconds / 60)}m)`;
                color = '#f43f5e';
                icon = 'breastmilk';
                meta = {
                    subType: 'nursing',
                    leftMinutes: Math.round(leftSeconds / 60),
                    rightMinutes: Math.round(rightSeconds / 60),
                    notes: `Nursing session (${elapsedMinutes} mins • L: ${Math.round(leftSeconds / 60)}m, R: ${Math.round(rightSeconds / 60)}m)`
                };
            } else if (feedMode === 'breastmilk') {
                title = 'Bottled Breastmilk';
                subtitle = `${elapsedMinutes}m bottle feed`;
                color = '#ec4899';
                icon = 'breastmilk';
                meta = { subType: 'breastmilk' };
            } else {
                title = 'Bottled Formula';
                subtitle = `${elapsedMinutes}m bottle feed`;
                color = '#f59e0b';
                icon = 'formula';
                meta = { subType: 'formula' };
            }
        } else if (type === 'pump') {
            elapsedMinutes = Math.max(1, Math.round(timers.pump.elapsedSeconds / 60));
            title = 'Pumping Session';
            subtitle = `${elapsedMinutes}m breast pump session`;
            color = '#a855f7';
            icon = 'pump';
        } else if (type === 'sleep') {
            elapsedMinutes = Math.max(1, Math.round(timers.sleep.elapsedSeconds / 60));
            title = 'Nap Sleep';
            subtitle = `${elapsedMinutes}m daytime nap`;
            color = '#6366f1';
            icon = 'sleep';
        } else if (type === 'tummy') {
            elapsedMinutes = Math.max(1, Math.round(timers.tummy.elapsedSeconds / 60));
            title = 'Tummy Time';
            subtitle = `${elapsedMinutes}m development play`;
            color = '#10b981';
            icon = 'tummy';
        }

        const newPending: PendingTimerSave = {
            type,
            title,
            subtitle,
            color,
            icon,
            elapsedMinutes,
            meta,
            isFading: false
        };

        setPendingSave(newPending);

        // Haptic feedback
        if ('vibrate' in navigator) {
            try { navigator.vibrate([35]); } catch (e) {}
        }

        // Gentle fade at 3.5s
        fadeTimerRef.current = setTimeout(() => {
            setPendingSave(prev => (prev ? { ...prev, isFading: true } : null));
        }, 3500);

        // Commit save and reset timer strictly after 5.0s expiration
        saveTimerRef.current = setTimeout(() => {
            commitPendingSave(newPending);
        }, 5000);
    };

    // Commit save to log and reset timer
    const commitPendingSave = (item: PendingTimerSave) => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

        onLogTimer(item.type, item.elapsedMinutes, item.meta);
        resetTimer(item.type);

        if (item.type === 'feed' && feedMode === 'nursing') {
            setLeftSeconds(0);
            setRightSeconds(0);
        }

        setPendingSave(null);
        setToastMessage(`✅ Saved and logged ${item.title} (${item.elapsedMinutes}m)!`);
        setTimeout(() => setToastMessage(null), 2500);
    };

    // User clicked Undo: Cancels save completely, leaves timer paused with all seconds preserved
    const handleUndoSave = () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

        const canceledTitle = pendingSave?.title;
        setPendingSave(null);

        setToastMessage(`↩️ Save canceled — ${canceledTitle || 'timer'} retained!`);
        setTimeout(() => setToastMessage(null), 2500);

        if ('vibrate' in navigator) {
            try { navigator.vibrate([25]); } catch (e) {}
        }
    };

    // User clicked Edit Activity: Opens custom modal with prefilled data and resets timer
    const handleEditSave = () => {
        if (!pendingSave) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

        const item = pendingSave;
        setPendingSave(null);

        if (onEditTimer) {
            onEditTimer(item.type, item.elapsedMinutes, item.meta);
        } else {
            onLogTimer(item.type, item.elapsedMinutes, item.meta);
        }

        resetTimer(item.type);
        if (item.type === 'feed' && feedMode === 'nursing') {
            setLeftSeconds(0);
            setRightSeconds(0);
        }
    };

    const handleResetFeed = () => {
        resetTimer('feed');
        setLeftSeconds(0);
        setRightSeconds(0);
    };

    const renderFeedCard = () => (
        <div className="surface-elevated" style={getTimerBoxStyle(timers.feed.isRunning)}>
            <div>
                {/* Header: Title left, Status + Reminder Pill + Reset right */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                        <ThemeIcon name={feedMode === 'nursing' ? 'breastmilk' : (feedMode === 'breastmilk' ? 'breastmilk' : 'formula')} />
                        <span style={{ fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Feed Timer
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span
                            id="feed-timer-reminder-badge"
                            style={{
                                fontSize: '9px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: timers.feed.isRunning ? '#0284c7' : (isFeedDue ? '#ef4444' : 'var(--badge-bg)'),
                                color: timers.feed.isRunning || isFeedDue ? '#fff' : 'var(--text-muted)'
                            }}
                        >
                            {timers.feed.isRunning ? 'FEEDING' : (isFeedDue ? 'DUE NOW!' : formatRemainingBadge(feedDiffMs))}
                        </span>
                        <button
                            id="btn-feed-timer-reset"
                            onClick={handleResetFeed}
                            aria-label="Reset Feed Timer"
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '2px' }}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Segmented Mode Selector: Formula | Breastmilk | Nursing */}
                <div style={{
                    display: 'flex',
                    gap: '3px',
                    background: 'var(--bg-surface)',
                    padding: '2px',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    border: '1px solid var(--border-color)'
                }}>
                    {(['formula', 'breastmilk', 'nursing'] as const).map(m => (
                        <button
                            key={m}
                            id={`feed-mode-tab-${m}`}
                            onClick={() => setFeedMode(m)}
                            style={{
                                flex: 1,
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '3px 2px',
                                borderRadius: '6px',
                                border: 'none',
                                background: feedMode === m ? 'var(--primary-accent)' : 'transparent',
                                color: feedMode === m ? '#fff' : 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                textTransform: 'capitalize'
                            }}
                        >
                            {m === 'formula' ? 'Formula' : (m === 'breastmilk' ? 'Milk' : 'Nursing')}
                        </button>
                    ))}
                </div>

                {/* Digital Display */}
                <div id="feed-timer-display" className="arcade-pixel-text" style={{ fontSize: '22px', fontWeight: 900, textAlign: 'center', margin: '2px 0', color: 'var(--text-primary)' }}>
                    {formatTime(feedDisplaySeconds)}
                </div>

                {/* Discard Milk 1-Hour Safety Countdown */}
                <div
                    id="feed-discard-milk-countdown"
                    data-remaining-seconds={discardRemainingSeconds}
                    data-expired={isDiscardExpired ? 'true' : 'false'}
                    data-active={isDiscardActive ? 'true' : 'false'}
                    aria-label="Discard milk countdown timer"
                    style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: isDiscardExpired ? '#dc2626' : (discardRemainingSeconds <= 600 && isDiscardActive ? '#ea580c' : '#ef4444'),
                        textAlign: 'center',
                        marginTop: '0px',
                        marginBottom: '4px',
                        letterSpacing: '0.01em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        lineHeight: 1.2
                    }}
                >
                    <span>
                        Discard Milk in {formatDiscardTimer(discardRemainingSeconds)}
                        {isDiscardExpired ? ' (Expired)' : ''}
                    </span>
                </div>

                {/* Nursing Dual Breast Left / Right Selector */}
                {feedMode === 'nursing' && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                        <button
                            id="nursing-left-breast-btn"
                            data-seconds={leftSeconds}
                            onClick={() => handleNursingToggle('left')}
                            style={{
                                flex: 1,
                                height: '24px',
                                borderRadius: '6px',
                                border: nursingSide === 'left' ? '1.5px solid #be123c' : '1px solid var(--border-color)',
                                background: nursingSide === 'left' ? '#fda4af' : 'var(--bg-surface)',
                                color: nursingSide === 'left' ? '#881337' : 'var(--text-secondary)',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            Left ({Math.round(leftSeconds / 60)}m)
                        </button>
                        <button
                            id="nursing-right-breast-btn"
                            data-seconds={rightSeconds}
                            onClick={() => handleNursingToggle('right')}
                            style={{
                                flex: 1,
                                height: '24px',
                                borderRadius: '6px',
                                border: nursingSide === 'right' ? '1.5px solid #be123c' : '1px solid var(--border-color)',
                                background: nursingSide === 'right' ? '#f43f5e' : 'var(--bg-surface)',
                                color: nursingSide === 'right' ? '#fff' : 'var(--text-secondary)',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            Right ({Math.round(rightSeconds / 60)}m)
                        </button>
                    </div>
                )}
            </div>

            {/* Button Bar with integrated reminder */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <button
                    id="btn-feed-timer-action"
                    onClick={() => (timers.feed.isRunning ? pauseTimer('feed') : startTimer('feed'))}
                    style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '8px',
                        border: 'none',
                        background: timers.feed.isRunning ? TIMER_BTN_PAUSE : TIMER_BTN_START,
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {timers.feed.isRunning ? <Pause size={13} /> : <Play size={13} fill="#fff" />}
                        <span>{timers.feed.isRunning ? 'Pause' : 'Start Feed'}</span>
                    </div>
                    {!timers.feed.isRunning && (
                        <span style={{ fontSize: '9.5px', opacity: 0.92, fontWeight: 700 }}>
                            {isFeedDue ? 'Next feed due now!' : `Next feed ${formatCountdownShort(feedDiffMs)}`}
                        </span>
                    )}
                </button>
                <button
                    id="btn-feed-timer-save"
                    onClick={() => handleInitiateSave('feed')}
                    disabled={feedDisplaySeconds === 0}
                    style={{
                        width: '68px',
                        height: '36px',
                        borderRadius: '8px',
                        border: 'none',
                        background: TIMER_BTN_SAVE,
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: feedDisplaySeconds > 0 ? 'pointer' : 'not-allowed',
                        opacity: feedDisplaySeconds > 0 ? 1 : 0.45,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                    }}
                >
                    <Save size={12} />
                    <span>Save</span>
                </button>
            </div>
        </div>
    );

    const renderPumpCard = () => (
        <div className="surface-elevated" style={getTimerBoxStyle(timers.pump.isRunning)}>
            <div>
                {/* Header: Title left, Status + Reminder Pill + Reset right */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                        <ThemeIcon name="pump" />
                        <span style={{ fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Pump Timer
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span
                            id="pump-timer-reminder-badge"
                            style={{
                                fontSize: '9px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: timers.pump.isRunning ? '#a855f7' : (isPumpDue ? '#d97706' : 'var(--badge-bg)'),
                                color: timers.pump.isRunning || isPumpDue ? '#fff' : 'var(--text-muted)'
                            }}
                        >
                            {timers.pump.isRunning ? 'PUMPING' : (isPumpDue ? 'DUE NOW!' : formatRemainingBadge(pumpDiffMs))}
                        </span>
                        <button
                            id="btn-pump-timer-reset"
                            onClick={() => resetTimer('pump')}
                            aria-label="Reset Pump Timer"
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '2px' }}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Digital Display */}
                <div id="pump-timer-display" className="arcade-pixel-text" style={{ fontSize: '22px', fontWeight: 900, textAlign: 'center', margin: '4px 0 2px 0', color: 'var(--text-primary)' }}>
                    {formatTime(timers.pump.elapsedSeconds)}
                </div>

                {/* Pump Reminder Info */}
                <div style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: isPumpDue ? '#d97706' : 'var(--text-muted)',
                    textAlign: 'center',
                    marginBottom: '6px',
                    letterSpacing: '0.01em'
                }}>
                    <span>Interval: Every {pumpIntervalHours}h (Anchored to start)</span>
                </div>
            </div>

            {/* Buttons with integrated reminder */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <button
                    id="btn-pump-timer-action"
                    onClick={() => (timers.pump.isRunning ? pauseTimer('pump') : startTimer('pump'))}
                    style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '8px',
                        border: 'none',
                        background: timers.pump.isRunning ? TIMER_BTN_PAUSE : TIMER_BTN_START,
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {timers.pump.isRunning ? <Pause size={13} /> : <Play size={13} fill="#fff" />}
                        <span>{timers.pump.isRunning ? 'Pause' : 'Start Pump'}</span>
                    </div>
                    {!timers.pump.isRunning && (
                        <span style={{ fontSize: '9.5px', opacity: 0.92, fontWeight: 700 }}>
                            {isPumpDue ? 'Pump session due now!' : `Next pump ${formatCountdownShort(pumpDiffMs)}`}
                        </span>
                    )}
                </button>
                <button
                    id="btn-pump-timer-save"
                    onClick={() => handleInitiateSave('pump')}
                    disabled={timers.pump.elapsedSeconds === 0}
                    style={{
                        width: '68px',
                        height: '36px',
                        borderRadius: '8px',
                        border: 'none',
                        background: TIMER_BTN_SAVE,
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: timers.pump.elapsedSeconds > 0 ? 'pointer' : 'not-allowed',
                        opacity: timers.pump.elapsedSeconds > 0 ? 1 : 0.45,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                    }}
                >
                    <Save size={12} />
                    <span>Save</span>
                </button>
            </div>
        </div>
    );

    const renderSleepCard = () => (
        <div className="surface-elevated" style={getTimerBoxStyle(timers.sleep.isRunning)}>
            <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                        <ThemeIcon name="sleep" />
                        <span style={{ fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Nap Timer
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: timers.sleep.isRunning ? '#6366f1' : 'var(--badge-bg)',
                            color: timers.sleep.isRunning ? '#fff' : 'var(--text-muted)'
                        }}>
                            {timers.sleep.isRunning ? 'SLEEPING' : 'READY'}
                        </span>
                        <button
                            id="btn-sleep-timer-reset"
                            onClick={() => resetTimer('sleep')}
                            aria-label="Reset Nap Timer"
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '2px' }}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Digital Display */}
                <div id="sleep-timer-display" className="arcade-pixel-text" style={{ fontSize: '22px', fontWeight: 900, textAlign: 'center', margin: '6px 0', color: 'var(--text-primary)' }}>
                    {formatTime(timers.sleep.elapsedSeconds)}
                </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <button
                    id="btn-sleep-timer-action"
                    onClick={() => (timers.sleep.isRunning ? pauseTimer('sleep') : startTimer('sleep'))}
                    style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '8px',
                        border: 'none',
                        background: timers.sleep.isRunning ? TIMER_BTN_PAUSE : TIMER_BTN_START,
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    {timers.sleep.isRunning ? <Pause size={13} /> : <Play size={13} />}
                    <span>{timers.sleep.isRunning ? 'Pause' : 'Start Nap'}</span>
                </button>
                <button
                    id="btn-sleep-timer-save"
                    onClick={() => handleInitiateSave('sleep')}
                    disabled={timers.sleep.elapsedSeconds === 0}
                    style={{
                        width: '68px',
                        height: '36px',
                        borderRadius: '8px',
                        border: 'none',
                        background: TIMER_BTN_SAVE,
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: timers.sleep.elapsedSeconds > 0 ? 'pointer' : 'not-allowed',
                        opacity: timers.sleep.elapsedSeconds > 0 ? 1 : 0.45,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                    }}
                >
                    <Save size={12} />
                    <span>Save</span>
                </button>
            </div>
        </div>
    );

    const renderTummyCard = () => (
        <div className="surface-elevated" style={getTimerBoxStyle(timers.tummy.isRunning)}>
            <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                        <ThemeIcon name="tummy" />
                        <span style={{ fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Tummy Time
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: timers.tummy.isRunning ? '#22c55e' : 'var(--badge-bg)',
                            color: timers.tummy.isRunning ? '#fff' : 'var(--text-muted)'
                        }}>
                            {timers.tummy.isRunning ? 'ACTIVE' : 'READY'}
                        </span>
                        <button
                            id="btn-tummy-timer-reset"
                            onClick={() => resetTimer('tummy')}
                            aria-label="Reset Tummy Time"
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '2px' }}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Digital Display */}
                <div id="tummy-timer-display" className="arcade-pixel-text" style={{ fontSize: '22px', fontWeight: 900, textAlign: 'center', margin: '6px 0', color: 'var(--text-primary)' }}>
                    {formatTime(timers.tummy.elapsedSeconds)}
                </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <button
                    id="btn-tummy-timer-action"
                    onClick={() => (timers.tummy.isRunning ? pauseTimer('tummy') : startTimer('tummy'))}
                    style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '8px',
                        border: 'none',
                        background: timers.tummy.isRunning ? TIMER_BTN_PAUSE : TIMER_BTN_START,
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    {timers.tummy.isRunning ? <Pause size={13} /> : <Play size={13} />}
                    <span>{timers.tummy.isRunning ? 'Pause' : 'Start Tummy'}</span>
                </button>
                <button
                    id="btn-tummy-timer-save"
                    onClick={() => handleInitiateSave('tummy')}
                    disabled={timers.tummy.elapsedSeconds === 0}
                    style={{
                        width: '68px',
                        height: '36px',
                        borderRadius: '8px',
                        border: 'none',
                        background: TIMER_BTN_SAVE,
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: timers.tummy.elapsedSeconds > 0 ? 'pointer' : 'not-allowed',
                        opacity: timers.tummy.elapsedSeconds > 0 ? 1 : 0.45,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                    }}
                >
                    <Save size={12} />
                    <span>Save</span>
                </button>
            </div>
        </div>
    );

    const renderTimerCard = (key: string) => {
        switch (key) {
            case 'feed': return renderFeedCard();
            case 'pump': return renderPumpCard();
            case 'sleep': return renderSleepCard();
            case 'tummy': return renderTummyCard();
            default: return null;
        }
    };

    const visibleTimerKeys = timerOrder.filter(k => !hiddenTimerIds.includes(k));

    return (
        <section className="surface-card" style={{ marginBottom: '16px', position: 'relative' }}>


            {/* Notification Toast */}
            {toastMessage && (
                <div style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    animation: 'fadeIn 0.2s ease'
                }}>
                    <span>{toastMessage}</span>
                    <button
                        onClick={() => setToastMessage(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Hidden Stopwatches Restore Shelf in Layout Customization Mode */}
            {settings.isLayoutEditMode && hiddenTimerIds.length > 0 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px dashed var(--border-color)',
                    marginBottom: '12px'
                }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>
                        Hidden Stopwatches (+ Tap to restore):
                    </span>
                    {hiddenTimerIds.map(hId => {
                        const timerTitles: Record<string, string> = {
                            feed: 'Feed Timer',
                            pump: 'Pump Timer',
                            sleep: 'Nap Timer',
                            tummy: 'Tummy Time'
                        };
                        return (
                            <button
                                key={hId}
                                type="button"
                                onClick={() => restoreTimerItem(hId)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    border: '1px dashed #f59e0b',
                                    backgroundColor: 'transparent',
                                    color: '#f59e0b',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                <Plus size={11} />
                                <span>{timerTitles[hId] || hId}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Timer Grid (Feed, Pump, Nap, Tummy) with Drag & Reorder + Hide */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '8px'
            }}>
                {visibleTimerKeys.map(timerKey => {
                    const isDragged = draggedTimerId === timerKey;
                    const isOver = dragOverTimerId === timerKey;

                    return (
                        <div
                            key={timerKey}
                            data-drag-inner="true"
                            style={{
                                position: 'relative',
                                cursor: settings.isLayoutEditMode ? 'grab' : 'default',
                                display: 'flex',
                                flexDirection: 'column',
                                opacity: isDragged ? 0.35 : 1,
                                transform: isOver ? 'scale(1.02)' : undefined,
                                transition: 'transform 0.15s ease, opacity 0.15s ease'
                            }}
                            draggable={settings.isLayoutEditMode}
                            onDragStart={(e) => handleDragStartTimer(e, timerKey)}
                            onDragOver={(e) => handleDragOverTimer(e, timerKey)}
                            onDragLeave={handleDragLeaveTimer}
                            onDragEnd={handleDragEndTimer}
                            onDrop={(e) => handleDropTimer(e, timerKey)}
                        >
                            {/* Layout Customization Control Bar (Arrows + Remove) */}
                            {settings.isLayoutEditMode && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    left: '0',
                                    right: '0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0 4px',
                                    zIndex: 25
                                }}>
                                    <div style={{ display: 'flex', gap: '3px' }}>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                moveTimerItem(timerKey, 'left');
                                            }}
                                            aria-label={`Move ${timerKey} timer left`}
                                            title="Move left"
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--bg-surface-elevated)',
                                                border: '1px solid var(--border-color)',
                                                color: 'var(--text-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            <ChevronLeft size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                moveTimerItem(timerKey, 'right');
                                            }}
                                            aria-label={`Move ${timerKey} timer right`}
                                            title="Move right"
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--bg-surface-elevated)',
                                                border: '1px solid var(--border-color)',
                                                color: 'var(--text-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            <ChevronRight size={12} />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            hideTimerItem(timerKey);
                                        }}
                                        aria-label={`Hide ${timerKey} stopwatch`}
                                        title={`Hide stopwatch`}
                                        className="layout-remove-badge"
                                        style={{
                                            position: 'static',
                                            width: '20px',
                                            height: '20px',
                                            fontSize: '12px'
                                        }}
                                    >
                                        −
                                    </button>
                                </div>
                            )}

                            {/* Drag handle header when in customization mode */}
                            {settings.isLayoutEditMode && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    padding: '4px 8px',
                                    marginBottom: '4px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                    color: '#f59e0b',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    cursor: 'grab'
                                }}>
                                    <GripHorizontal size={13} />
                                    <span>Drag or use ← → to move</span>
                                </div>
                            )}

                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: '12px',
                                border: isOver ? '2px dashed #f59e0b' : undefined,
                                overflow: 'hidden'
                            }}>
                                {renderTimerCard(timerKey)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 5-Second Pending Save Popup with Undo & Edit Activity (Identical to Quick Log Popup) */}
            {pendingSave && (
                <div
                    id="timer-save-undo-popup"
                    role="alert"
                    aria-live="assertive"
                    style={{
                        position: 'fixed',
                        bottom: '84px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'calc(100% - 32px)',
                        maxWidth: '430px',
                        zIndex: 9999,
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '2px solid var(--border-color)',
                        borderRadius: '16px',
                        boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                        padding: '12px 14px',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        opacity: pendingSave.isFading ? 0 : 1,
                        transition: 'opacity 1.5s ease-out, transform 0.25s ease',
                        pointerEvents: pendingSave.isFading ? 'none' : 'auto',
                        animation: 'slideUp 0.25s ease'
                    }}
                >
                    {/* Top Row: Icon, Title, and Direct Commit / Close */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '10px',
                                backgroundColor: `${pendingSave.color}25`,
                                border: `1px solid ${pendingSave.color}60`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <ThemeIcon name={pendingSave.icon as any} />
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {pendingSave.title}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {pendingSave.subtitle}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => commitPendingSave(pendingSave)}
                            title="Save now"
                            aria-label="Save now"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: 'var(--text-muted)'
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Action buttons: Edit Activity & Undo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                            id="btn-timer-log-edit"
                            onClick={handleEditSave}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <Pencil size={14} style={{ color: 'var(--primary-accent)' }} />
                            <span>Edit Activity</span>
                        </button>

                        <button
                            id="btn-timer-log-undo"
                            onClick={handleUndoSave}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                color: '#ef4444',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <RotateCcw size={14} />
                            <span>Undo</span>
                        </button>
                    </div>

                    {/* 5-second countdown progress bar */}
                    <div style={{
                        width: '100%',
                        height: '3px',
                        backgroundColor: 'var(--border-color)',
                        borderRadius: '999px',
                        overflow: 'hidden',
                        marginTop: '2px'
                    }}>
                        <div
                            style={{
                                height: '100%',
                                backgroundColor: pendingSave.color || 'var(--primary-accent)',
                                animation: 'quickLogCountdown 5s linear forwards'
                            }}
                        />
                    </div>
                </div>
            )}
        </section>
    );
};
