import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ActivityCard } from './ActivityCard';
import type { ActivityLog } from '../../types/log';
import { ChevronLeft, ChevronRight, RotateCcw, EyeOff, Calendar, X, Clock } from 'lucide-react';

interface MonthlyActivityCalendarProps {
    onEditLog?: (log: ActivityLog) => void;
}

export const MonthlyActivityCalendar: React.FC<MonthlyActivityCalendarProps> = ({ onEditLog }) => {
    const { logs, selectedDate, setSelectedDate, isCalendarVisible, setIsCalendarVisible } = useApp();

    const [modalDate, setModalDate] = useState<string | null>(null);

    const [currentYear, setCurrentYear] = useState<number>(() => {
        if (selectedDate) {
            const parts = selectedDate.split('-');
            if (parts.length === 3) return parseInt(parts[0], 10);
        }
        return new Date().getFullYear();
    });

    const [currentMonth, setCurrentMonth] = useState<number>(() => {
        if (selectedDate) {
            const parts = selectedDate.split('-');
            if (parts.length === 3) return parseInt(parts[1], 10) - 1;
        }
        return new Date().getMonth();
    });

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
    };

    const getTodayStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const todayStr = getTodayStr();

    const jumpToToday = () => {
        const now = new Date();
        setCurrentYear(now.getFullYear());
        setCurrentMonth(now.getMonth());
        setSelectedDate(todayStr);
    };

    // Calculate grid numbers
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Map logs by dateStr for quick lookup
    const logsByDate: Record<string, ActivityLog[]> = {};
    logs.forEach(l => {
        if (!logsByDate[l.dateStr]) logsByDate[l.dateStr] = [];
        logsByDate[l.dateStr].push(l);
    });

    const isTodaySelected = selectedDate === todayStr;

    // Close modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setModalDate(null);
        };
        if (modalDate) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [modalDate]);

    const formatModalDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getRelativeLabel = (dateStr: string) => {
        if (dateStr === todayStr) return 'Today';
        const yDate = new Date();
        yDate.setDate(yDate.getDate() - 1);
        const yStr = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(yDate.getDate()).padStart(2, '0')}`;
        if (dateStr === yStr) return 'Yesterday';

        const tDate = new Date();
        tDate.setDate(tDate.getDate() + 1);
        const tStr = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;
        if (dateStr === tStr) return 'Tomorrow';

        return '';
    };

    const modalDayLogs = modalDate ? (logsByDate[modalDate] || []) : [];

    if (!isCalendarVisible) {
        return (
            <section
                id="monthly-activity-calendar"
                className="surface-card"
                style={{
                    marginBottom: '24px',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    borderRadius: '16px',
                    border: '1px dashed var(--border-color)',
                    backgroundColor: 'var(--bg-surface-elevated)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🗓️</span>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                            Monthly Activity Calendar (Hidden)
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Tap the date in the activity log stream or click show to expand
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setIsCalendarVisible(true)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        color: 'var(--primary-accent)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <Calendar size={13} />
                    <span>Show Calendar</span>
                </button>
            </section>
        );
    }

    return (
        <section id="monthly-activity-calendar" className="surface-card" style={{ marginBottom: '24px' }}>
            {/* Calendar Header with Month/Year Navigation */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🗓️</span>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Monthly Activity Calendar</span>
                            {!isTodaySelected && (
                                <button
                                    type="button"
                                    onClick={jumpToToday}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                        color: '#d97706',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                    title="Jump to current month & today"
                                >
                                    <RotateCcw size={10} />
                                    <span>Jump to Today</span>
                                </button>
                            )}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                            Tap any date to inspect full logged activities in a scrollable view
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                        type="button"
                        onClick={prevMonth}
                        aria-label="Previous month"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <span style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        minWidth: '135px',
                        textAlign: 'center',
                        color: 'var(--text-primary)'
                    }}>
                        {monthNames[currentMonth]} {currentYear}
                    </span>

                    <button
                        type="button"
                        onClick={nextMonth}
                        aria-label="Next month"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <ChevronRight size={16} />
                    </button>

                    {/* Small Hide Calendar Button */}
                    <button
                        type="button"
                        onClick={() => setIsCalendarVisible(false)}
                        title="Hide monthly calendar"
                        aria-label="Hide monthly activity calendar"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            color: 'var(--text-muted)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            marginLeft: '4px'
                        }}
                    >
                        <EyeOff size={13} />
                        <span>Hide</span>
                    </button>
                </div>
            </div>

            {/* Days of Week Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--text-muted)',
                marginBottom: '8px'
            }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} style={{ padding: '4px 0' }}>{d}</div>
                ))}
            </div>

            {/* Calendar Days Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px'
            }}>
                {/* Empty slots before first day */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <div
                        key={`blank-${idx}`}
                        style={{
                            minHeight: '62px',
                            borderRadius: '16px',
                            backgroundColor: 'transparent',
                            opacity: 0.3
                        }}
                    />
                ))}

                {/* Days in Month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1;
                    const dayDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = dayDateStr === selectedDate;
                    const isToday = dayDateStr === todayStr;

                    const dayLogs = logsByDate[dayDateStr] || [];
                    const count = dayLogs.length;

                    const hasFormula = dayLogs.some(l => l.category === 'feeding' && l.subType !== 'breastmilk');
                    const hasBreastmilk = dayLogs.some(l => l.category === 'feeding' && l.subType === 'breastmilk');
                    const hasPump = dayLogs.some(l => l.category === 'pumping');
                    const hasPee = dayLogs.some(l => l.category === 'diaper' && (l.subType === 'pee' || l.subType === 'both'));
                    const hasPoop = dayLogs.some(l => l.category === 'diaper' && (l.subType === 'poop' || l.subType === 'both'));
                    const hasSleep = dayLogs.some(l => l.category === 'sleep');

                    return (
                        <div
                            key={dayDateStr}
                            id={`calendar-cell-${dayDateStr}`}
                            role="button"
                            tabIndex={0}
                            aria-label={`Date ${dayDateStr}, ${count} activities logged. Click to view activities.`}
                            onClick={() => {
                                setSelectedDate(dayDateStr);
                                setModalDate(dayDateStr);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedDate(dayDateStr);
                                    setModalDate(dayDateStr);
                                }
                            }}
                            style={{
                                minHeight: '62px',
                                padding: '8px 10px',
                                borderRadius: '16px',
                                border: isSelected
                                    ? '2px solid #f59e0b'
                                    : isToday
                                        ? '1.5px solid #38bdf8'
                                        : '1px solid var(--border-color)',
                                backgroundColor: isSelected
                                    ? 'rgba(254, 243, 199, 0.85)'
                                    : isToday
                                        ? 'rgba(56, 189, 248, 0.08)'
                                        : 'var(--bg-surface-elevated)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: isSelected ? '0 0 0 3px rgba(245, 158, 11, 0.25)' : 'none'
                            }}
                        >
                            {/* Top Row: Day Number & Event Count */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: isSelected || isToday ? 900 : 700,
                                    color: isSelected ? '#92400e' : isToday ? '#0284c7' : 'var(--text-primary)'
                                }}>
                                    {day}
                                </span>
                                {count > 0 && (
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: 800,
                                        padding: '1px 5px',
                                        borderRadius: '999px',
                                        backgroundColor: isSelected ? '#f59e0b' : 'rgba(0,0,0,0.06)',
                                        color: isSelected ? '#ffffff' : 'var(--text-muted)'
                                    }}>
                                        {count}
                                    </span>
                                )}
                            </div>

                            {/* Bottom Row: Activity Category Indicator Dots */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                                minHeight: '8px',
                                marginTop: '4px'
                            }}>
                                {hasFormula && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }} title="Formula" />}
                                {hasBreastmilk && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f43f5e' }} title="Breastmilk" />}
                                {hasPump && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#a855f7' }} title="Pumping" />}
                                {hasPee && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }} title="Pee" />}
                                {hasPoop && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#b45309' }} title="Poop" />}
                                {hasSleep && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6366f1' }} title="Sleep" />}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Day Activities Pop-Up Modal */}
            {modalDate && (
                <div
                    id="calendar-day-modal-overlay"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(4px)',
                        padding: '16px'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setModalDate(null);
                    }}
                >
                    <div
                        id="calendar-day-modal-content"
                        style={{
                            width: '100%',
                            maxWidth: '520px',
                            maxHeight: '75vh',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: '16px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
                            overflow: 'hidden',
                            color: 'var(--text-primary)'
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 18px',
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-surface-elevated)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                    color: '#f59e0b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                            {formatModalDate(modalDate)}
                                        </h3>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            backgroundColor: modalDayLogs.length > 0 ? '#f59e0b' : 'var(--bg-surface)',
                                            color: modalDayLogs.length > 0 ? '#ffffff' : 'var(--text-muted)',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            {modalDayLogs.length} {modalDayLogs.length === 1 ? 'activity' : 'activities'}
                                        </span>
                                    </div>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {getRelativeLabel(modalDate) ? `${getRelativeLabel(modalDate)} • ` : ''}Daily Activity Log
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                id="btn-close-calendar-modal"
                                onClick={() => setModalDate(null)}
                                aria-label="Close activities popup"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Scrollable & Swipable Activities List */}
                        <div
                            id="calendar-day-modal-scroll-area"
                            style={{
                                padding: '16px',
                                overflowY: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                overscrollBehavior: 'contain',
                                touchAction: 'pan-y',
                                scrollbarWidth: 'thin',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}
                        >
                            {modalDayLogs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>✨</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        No logged activities on this day
                                    </div>
                                    <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>
                                        Activities recorded for this date will appear here.
                                    </p>
                                </div>
                            ) : (
                                modalDayLogs.map(log => (
                                    <ActivityCard
                                        key={log.id}
                                        log={log}
                                        onEdit={(logToEdit) => {
                                            setModalDate(null);
                                            onEditLog?.(logToEdit);
                                        }}
                                    />
                                ))
                            )}
                        </div>

                        {/* Modal Footer with Swipe / Scroll Instruction */}
                        <div style={{
                            padding: '10px 18px',
                            borderTop: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                <Clock size={12} />
                                <span>↕️ Scroll or swipe to navigate activities</span>
                            </div>
                            <button
                                type="button"
                                id="btn-done-calendar-modal"
                                onClick={() => setModalDate(null)}
                                className="btn-primary"
                                style={{
                                    fontSize: '12px',
                                    padding: '6px 16px',
                                    backgroundColor: '#f59e0b',
                                    borderColor: '#f59e0b'
                                }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
