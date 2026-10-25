import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ThemeIcon, type IconName } from '../common/ThemeIcon';
import { Pencil, RotateCcw, X, Plus, ChevronLeft, ChevronRight, GripHorizontal } from 'lucide-react';
import type { ActivityCategory, ActivityLog } from '../../types/log';

interface QuickLoggingPadProps {
    onOpenCustomEntry: (category?: ActivityCategory, subType?: string) => void;
    onEditLog?: (log: ActivityLog) => void;
}

interface QuickLogPopupData {
    log: ActivityLog;
    itemTitle: string;
    itemSubtitle: string;
    itemColor: string;
    icon: IconName;
    isFading: boolean;
}

interface QuickItemConfig {
    id: string;
    icon: IconName;
    title: string;
    subtitle: string;
    category: ActivityCategory;
    subType?: string;
    amountMl?: number;
    durationMinutes?: number;
    notes?: string;
    color: string;
    action?: 'log' | 'openModal';
}


export const QuickLoggingPad: React.FC<QuickLoggingPadProps> = ({ onOpenCustomEntry, onEditLog }) => {
    const { addLog, deleteLog, settings, updateSettings, rateLimitWarning, clearRateLimitWarning } = useApp();
    const [activeAnimId, setActiveAnimId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isPinEditMode, setIsPinEditMode] = useState<boolean>(false);
    const [quickPopup, setQuickPopup] = useState<QuickLogPopupData | null>(null);
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
    const popupTimerRef = useRef<NodeJS.Timeout | null>(null);
    const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastClickRef = useRef<{ time: number; count: number }>({ time: 0, count: 0 });

    const defaultQuickLogOrder = [
        'pee', 'poop', 'feed', 'pump', 'sleep', 'medication', 'tummy', 'bath', 'vitals', 'growth', 'milestone', 'other'
    ];
    const rawOrder = settings.quickLogOrder && settings.quickLogOrder.length > 0
        ? settings.quickLogOrder
        : defaultQuickLogOrder;

    // Migrate legacy 'vitamins' -> 'medication', 'temp' -> 'vitals', and remove 'solids'
    const quickLogOrder = Array.from(new Set(
        rawOrder
            .map(id => id === 'vitamins' ? 'medication' : (id === 'temp' ? 'vitals' : id))
            .filter(id => id !== 'solids')
    ));
    const hiddenQuickLogIds = settings.hiddenQuickLogIds || [];

    const hideQuickLogItem = (id: string) => {
        const nextHidden = Array.from(new Set([...hiddenQuickLogIds, id]));
        updateSettings({ hiddenQuickLogIds: nextHidden });
    };

    const restoreQuickLogItem = (id: string) => {
        const nextHidden = hiddenQuickLogIds.filter(h => h !== id);
        updateSettings({ hiddenQuickLogIds: nextHidden });
    };

    const moveQuickLogItem = (id: string, direction: 'left' | 'right') => {
        const currentList = [...quickLogOrder];
        const index = currentList.indexOf(id);
        if (index === -1) return;
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentList.length) return;
        const temp = currentList[index];
        currentList[index] = currentList[targetIndex];
        currentList[targetIndex] = temp;
        updateSettings({ quickLogOrder: currentList });
    };

    const handleDragStartItem = (e: React.DragEvent, id: string) => {
        e.stopPropagation();
        setDraggedItemId(id);
        e.dataTransfer.setData('application/x-quicklog-id', id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOverItem = (e: React.DragEvent, targetId: string) => {
        if (settings.isLayoutEditMode) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            if (dragOverItemId !== targetId) {
                setDragOverItemId(targetId);
            }
        }
    };

    const handleDragLeaveItem = (e: React.DragEvent) => {
        e.stopPropagation();
        setDragOverItemId(null);
    };

    const handleDragEndItem = (e: React.DragEvent) => {
        e.stopPropagation();
        setDraggedItemId(null);
        setDragOverItemId(null);
    };

    const handleDropItem = (e: React.DragEvent, targetId: string) => {
        if (!settings.isLayoutEditMode) return;
        e.preventDefault();
        e.stopPropagation();
        const sourceId = e.dataTransfer.getData('application/x-quicklog-id') || e.dataTransfer.getData('text/plain') || draggedItemId;
        setDraggedItemId(null);
        setDragOverItemId(null);
        if (!sourceId || sourceId === targetId) return;

        const currentList = [...quickLogOrder];
        const sourceIndex = currentList.indexOf(sourceId);
        const targetIndex = currentList.indexOf(targetId);
        if (sourceIndex === -1 || targetIndex === -1) return;

        currentList.splice(sourceIndex, 1);
        currentList.splice(targetIndex, 0, sourceId);
        updateSettings({ quickLogOrder: currentList });
    };

    useEffect(() => {
        return () => {
            if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
            if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        };
    }, []);

    const feedVol = settings.defaultFeedVolume || 60;
    const pumpVol = settings.defaultPumpAmount || 100;
    const napMins = settings.defaultNapMinutes || 60;
    const tummyMins = settings.defaultTummyMinutes || 5;

    // All unified quick logging categories
    const items: QuickItemConfig[] = [
        {
            id: 'pee',
            icon: 'pee',
            title: 'Pee',
            subtitle: '',
            category: 'diaper',
            subType: 'pee',
            notes: 'Quick logged wet diaper',
            color: '#ca8a04',
            action: 'log'
        },
        {
            id: 'poop',
            icon: 'poop',
            title: 'Poop',
            subtitle: '',
            category: 'diaper',
            subType: 'poop',
            notes: 'Quick logged dirty diaper',
            color: '#b45309',
            action: 'log'
        },
        {
            id: 'feed',
            icon: 'formula',
            title: 'Feed',
            subtitle: '',
            category: 'feeding',
            subType: 'formula',
            amountMl: feedVol,
            durationMinutes: 20,
            notes: `Quick logged feed (${feedVol} mL)`,
            color: '#f59e0b',
            action: 'log'
        },
        {
            id: 'pump',
            icon: 'pump',
            title: 'Pump',
            subtitle: '',
            category: 'pumping',
            subType: 'session',
            amountMl: pumpVol,
            durationMinutes: 20,
            notes: `Quick logged pump session (${pumpVol} mL)`,
            color: '#9333ea',
            action: 'log'
        },
        {
            id: 'sleep',
            icon: 'sleep',
            title: 'Sleep',
            subtitle: '',
            category: 'sleep',
            durationMinutes: napMins,
            notes: `Quick logged ${napMins} min nap`,
            color: '#4f46e5',
            action: 'log'
        },
        {
            id: 'medication',
            icon: 'vitamins',
            title: 'Medication',
            subtitle: '',
            category: 'health',
            subType: 'medication',
            color: '#059669',
            action: 'openModal'
        },
        {
            id: 'tummy',
            icon: 'tummy',
            title: 'Tummy',
            subtitle: '',
            category: 'tummy',
            durationMinutes: tummyMins,
            notes: `Quick logged ${tummyMins} min tummy time session`,
            color: '#16a34a',
            action: 'log'
        },
        {
            id: 'bath',
            icon: 'bath',
            title: 'Bath',
            subtitle: '',
            category: 'bath',
            durationMinutes: 15,
            notes: 'Quick logged warm bath and wash',
            color: '#06b6d4',
            action: 'log'
        },
        {
            id: 'vitals',
            icon: 'temp',
            title: 'Vitals',
            subtitle: '',
            category: 'health',
            subType: 'vitals',
            color: '#ef4444',
            action: 'openModal'
        },
        {
            id: 'growth',
            icon: 'growth',
            title: 'Growth',
            subtitle: '',
            category: 'growth',
            color: '#3b82f6',
            action: 'openModal'
        },
        {
            id: 'milestone',
            icon: 'milestone',
            title: 'Milestone',
            subtitle: '',
            category: 'milestone',
            color: '#fbbf24',
            action: 'openModal'
        },
        {
            id: 'other',
            icon: 'other',
            title: 'Other',
            subtitle: '',
            category: 'other',
            color: '#8b5cf6',
            action: 'openModal'
        }
    ];

    const orderedItems = [...items].sort((a, b) => {
        const idxA = quickLogOrder.indexOf(a.id);
        const idxB = quickLogOrder.indexOf(b.id);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    const visibleItems = orderedItems.filter(it => !hiddenQuickLogIds.includes(it.id));

    const handleUndo = (popupData: QuickLogPopupData) => {
        if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        deleteLog(popupData.log.id);
        setQuickPopup(null);
        setToastMessage(`↩️ Undone ${popupData.itemTitle}!`);
        setTimeout(() => setToastMessage(null), 2200);
        if ('vibrate' in navigator) {
            try { navigator.vibrate([25]); } catch (e) {}
        }
    };

    const handleEdit = (popupData: QuickLogPopupData) => {
        if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        setQuickPopup(null);
        if (onEditLog) {
            onEditLog(popupData.log);
        } else {
            onOpenCustomEntry(popupData.log.category);
        }
    };

    const handleQuickLog = (item: QuickItemConfig) => {
        if (isPinEditMode) {
            const pinnedQuickLogIds = settings.pinnedQuickLogIds || ['pee', 'poop', 'feed'];
            const next = pinnedQuickLogIds.includes(item.id)
                ? pinnedQuickLogIds.filter(x => x !== item.id)
                : [...pinnedQuickLogIds, item.id];
            updateSettings({ pinnedQuickLogIds: next });
            return;
        }

        if (item.action === 'openModal') {
            onOpenCustomEntry(item.category, item.subType);
            return;
        }

        const now = Date.now();
        if (now - lastClickRef.current.time < 800) {
            setToastMessage('⏳ Please wait a moment between quick logs.');
            setTimeout(() => setToastMessage(null), 1800);
            return;
        }
        lastClickRef.current.time = now;

        // Haptic feedback
        if ('vibrate' in navigator) {
            try { navigator.vibrate([35]); } catch (e) {}
        }

        setActiveAnimId(item.id);
        setTimeout(() => setActiveAnimId(null), 350);

        const newLog = addLog({
            category: item.category,
            subType: item.subType,
            amountMl: item.amountMl,
            durationMinutes: item.durationMinutes,
            notes: item.notes
        });

        if (newLog) {
            // Trigger 5-second brief popup with "Edit Activity" or "Undo"
            if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
            if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

            setQuickPopup({
                log: newLog,
                itemTitle: item.title,
                itemSubtitle: item.subtitle,
                itemColor: item.color,
                icon: item.icon,
                isFading: false
            });

            // Fades away slowly within 5 seconds:
            // Starts gentle 1.5s fade-out at 3.5s, dismounts cleanly at 5.0s
            fadeTimerRef.current = setTimeout(() => {
                setQuickPopup(prev => (prev ? { ...prev, isFading: true } : null));
            }, 3500);

            popupTimerRef.current = setTimeout(() => {
                setQuickPopup(null);
            }, 5000);
        } else {
            setToastMessage(`⚠️ Daily safety limit reached for ${item.title}!`);
            setTimeout(() => setToastMessage(null), 3500);
        }
    };

    return (
        <section id="quick-logging-pad" className="surface-card" style={{ marginBottom: '24px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>⚡</span>
                    <h2 style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                        Quick Log
                    </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!settings.isLayoutEditMode && (settings.pinnedQuickLogIds || []).length > 0 && (
                        <button
                            type="button"
                            id="toggle-quick-log-collapse-btn"
                            onClick={() => updateSettings({ isQuickLogCollapsed: !settings.isQuickLogCollapsed })}
                            className="btn-ghost"
                            style={{
                                fontSize: '11px',
                                padding: '5px 12px',
                                borderRadius: '12px',
                                border: settings.isQuickLogCollapsed ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                                background: settings.isQuickLogCollapsed ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-surface)',
                                color: settings.isQuickLogCollapsed ? '#f59e0b' : 'var(--text-secondary)',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            <span>📌</span>
                            <span>{settings.isQuickLogCollapsed ? `Show All (${visibleItems.length}) ▾` : `Pinned Only (${(settings.pinnedQuickLogIds || []).length}) ▴`}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Rate limit clinical advisory banner if triggered */}
            {rateLimitWarning && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '14px',
                    gap: '10px'
                }}>
                    <span>{rateLimitWarning}</span>
                    <button
                        onClick={clearRateLimitWarning}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            fontWeight: 800,
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Hidden Care Buttons Restore Shelf (When items are hidden in Layout Customization Mode) */}
            {settings.isLayoutEditMode && hiddenQuickLogIds.length > 0 && (
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
                        Hidden Care Buttons (+ Tap to restore):
                    </span>
                    {hiddenQuickLogIds.map(hId => {
                        const it = items.find(i => i.id === hId);
                        if (!it) return null;
                        return (
                            <button
                                key={hId}
                                type="button"
                                onClick={() => restoreQuickLogItem(hId)}
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
                                <span>{it.title}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Quick Logging Grid (Responsive Target Pad with Drag & Reorder + Pin & Hide support) */}
            {(() => {
                const pinnedQuickLogIds = settings.pinnedQuickLogIds || ['pee', 'poop', 'feed'];
                const togglePinQuickLogItem = (id: string) => {
                    const next = pinnedQuickLogIds.includes(id)
                        ? pinnedQuickLogIds.filter(x => x !== id)
                        : [...pinnedQuickLogIds, id];
                    updateSettings({ pinnedQuickLogIds: next });
                };

                const isCollapsed = Boolean(settings.isQuickLogCollapsed) && !settings.isLayoutEditMode && !isPinEditMode;
                const itemsToDisplay = (isCollapsed && pinnedQuickLogIds.length > 0)
                    ? visibleItems.filter(item => pinnedQuickLogIds.includes(item.id))
                    : visibleItems;

                return (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
                        gap: '10px'
                    }}>
                        {itemsToDisplay.map(item => {
                            const isFlashed = activeAnimId === item.id;
                            const isDragged = draggedItemId === item.id;
                            const isOver = dragOverItemId === item.id;
                            const isPinned = pinnedQuickLogIds.includes(item.id);

                            return (
                                <div
                                    key={item.id}
                                    data-drag-inner="true"
                                    style={{
                                        position: 'relative',
                                        cursor: settings.isLayoutEditMode ? 'grab' : 'default',
                                        opacity: isDragged ? 0.35 : 1,
                                        transform: isOver ? 'scale(1.04)' : undefined,
                                        transition: 'transform 0.15s ease, opacity 0.15s ease'
                                    }}
                                    draggable={settings.isLayoutEditMode}
                                    onDragStart={(e) => handleDragStartItem(e, item.id)}
                                    onDragOver={(e) => handleDragOverItem(e, item.id)}
                                    onDragLeave={handleDragLeaveItem}
                                    onDragEnd={handleDragEndItem}
                                    onDrop={(e) => handleDropItem(e, item.id)}
                                >
                                    {/* Layout Edit Mode Reorder Bar (Arrows + Pin + Remove) */}
                                    {settings.isLayoutEditMode && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            left: '0',
                                            right: '0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0 2px',
                                            zIndex: 20
                                        }}>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveQuickLogItem(item.id, 'left');
                                                    }}
                                                    aria-label={`Move ${item.title} left`}
                                                    title="Move left"
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
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
                                                    <ChevronLeft size={11} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveQuickLogItem(item.id, 'right');
                                                    }}
                                                    aria-label={`Move ${item.title} right`}
                                                    title="Move right"
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
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
                                                    <ChevronRight size={11} />
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', gap: '3px' }}>
                                                {/* Remove button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        hideQuickLogItem(item.id);
                                                    }}
                                                    aria-label={`Hide ${item.title}`}
                                                    title={`Hide ${item.title} button`}
                                                    className="layout-remove-badge"
                                                    style={{
                                                        position: 'static',
                                                        width: '18px',
                                                        height: '18px',
                                                        fontSize: '11px'
                                                    }}
                                                >
                                                    −
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Pin toggle button in Pin Edit Mode */}
                                    {isPinEditMode && (
                                        <button
                                            type="button"
                                            id={`btn-pin-quicklog-${item.id}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                togglePinQuickLogItem(item.id);
                                            }}
                                            aria-label={isPinned ? `Unpin ${item.title}` : `Pin ${item.title}`}
                                            title={isPinned ? 'Unpin activity' : 'Pin to favorites'}
                                            style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '4px',
                                                zIndex: 15,
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                backgroundColor: isPinned ? '#f59e0b' : 'var(--bg-surface-elevated)',
                                                border: isPinned ? '1px solid #f59e0b' : '1px dashed var(--border-color)',
                                                color: isPinned ? '#fff' : 'var(--text-muted)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: isPinned ? '0 1px 4px rgba(245, 158, 11, 0.4)' : 'none',
                                                fontSize: '10px'
                                            }}
                                        >
                                            📌
                                        </button>
                                    )}

                                    {/* Pinned activity indicator when not in layout or pin edit mode */}
                                    {!settings.isLayoutEditMode && !isPinEditMode && isPinned && (
                                        <span
                                            title="Pinned activity"
                                            style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '6px',
                                                fontSize: '9px',
                                                opacity: 0.55
                                            }}
                                        >
                                            📌
                                        </span>
                                    )}

                                    <button
                                        id={`btn-quick-log-${item.id}`}
                                        onClick={() => {
                                            if (settings.isLayoutEditMode) return;
                                            handleQuickLog(item);
                                        }}
                                        draggable={settings.isLayoutEditMode}
                                        onDragStart={(e) => handleDragStartItem(e, item.id)}
                                        onDragOver={(e) => handleDragOverItem(e, item.id)}
                                        onDrop={(e) => handleDropItem(e, item.id)}
                                        className="surface-elevated"
                                        aria-label={`Log ${item.title}`}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '12px 6px',
                                    cursor: settings.isLayoutEditMode ? 'grab' : 'pointer',
                                    border: isOver
                                        ? '2px dashed #f59e0b'
                                        : isFlashed
                                            ? `1.5px solid ${item.color}`
                                            : settings.isLayoutEditMode
                                                ? '1px dashed var(--border-color)'
                                                : '1px solid var(--border-color)',
                                    borderRadius: '14px',
                                    background: isOver
                                        ? 'rgba(245, 158, 11, 0.12)'
                                        : isFlashed
                                            ? `${item.color}25`
                                            : 'linear-gradient(135deg, var(--bg-surface-elevated) 0%, var(--bg-surface) 100%)',
                                    boxShadow: isFlashed ? `0 0 12px ${item.color}40` : '0 2px 6px rgba(0, 0, 0, 0.04)',
                                    transform: isFlashed ? 'scale(0.95)' : 'scale(1)',
                                    transition: 'transform 0.15s ease, border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
                                    textAlign: 'center',
                                    minHeight: '76px'
                                }}
                            >
                                {settings.isLayoutEditMode && (
                                    <div style={{ color: 'var(--text-muted)', marginBottom: '4px', opacity: 0.7 }}>
                                        <GripHorizontal size={13} />
                                    </div>
                                )}
                                <div style={{ marginBottom: '6px' }}>
                                    <ThemeIcon name={item.icon} />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {item.title}
                                </span>
                            </button>
                        </div>
                    );
                })}
                    </div>
                );
            })()}

            {/* Small red text on bottom right: Edit Pinned Activities / Confirm Choices */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginTop: '10px'
            }}>
                <button
                    type="button"
                    id="btn-edit-pinned-activities"
                    onClick={() => setIsPinEditMode(prev => !prev)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '2px 4px',
                        textDecoration: 'underline',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title={isPinEditMode ? 'Confirm and save pinned choices' : 'Change which quick log activities are pinned'}
                >
                    {isPinEditMode ? 'Confirm Choices' : 'Edit Pinned Activities'}
                </button>
            </div>

            {/* Toast Notification for limit warnings or undo confirmation */}
            {toastMessage && (
                <div style={{
                    marginTop: '12px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                    textAlign: 'center',
                    animation: 'fadeIn 0.2s ease'
                }}>
                    {toastMessage}
                </div>
            )}

            {/* 5-Second Interactive Brief Popup with "Edit Activity" and "Undo" */}
            {quickPopup && (
                <div
                    id="quick-log-popup"
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
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        opacity: quickPopup.isFading ? 0 : 1,
                        transition: 'opacity 1.5s ease-out, transform 0.25s ease',
                        pointerEvents: quickPopup.isFading ? 'none' : 'auto'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                backgroundColor: `${quickPopup.itemColor}25`,
                                border: `1.5px solid ${quickPopup.itemColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <ThemeIcon name={quickPopup.icon} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                        Logged {quickPopup.itemTitle}
                                    </span>
                                    {quickPopup.itemSubtitle && quickPopup.itemSubtitle.trim() !== '' && (
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            ({quickPopup.itemSubtitle})
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    Activity saved • Tap to edit or undo
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setQuickPopup(null)}
                            aria-label="Dismiss popup"
                            className="btn-ghost"
                            style={{
                                padding: '4px',
                                borderRadius: '6px',
                                color: 'var(--text-muted)'
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Action buttons: Edit Activity & Undo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                            id="btn-quick-log-edit"
                            onClick={() => handleEdit(quickPopup)}
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
                            id="btn-quick-log-undo"
                            onClick={() => handleUndo(quickPopup)}
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
                                backgroundColor: quickPopup.itemColor || 'var(--primary-accent)',
                                animation: 'quickLogCountdown 5s linear forwards'
                            }}
                        />
                    </div>
                </div>
            )}
        </section>
    );
};
