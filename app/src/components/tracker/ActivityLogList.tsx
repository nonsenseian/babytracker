import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActivityCard } from './ActivityCard';
import type { ActivityCategory, ActivityLog } from '../../types/log';
import { Search, Plus, X, ChevronLeft, ChevronRight, RotateCcw, CalendarDays, Filter } from 'lucide-react';

interface ActivityLogListProps {
    onEdit: (log: ActivityLog) => void;
    onAddNew: () => void;
}

export const ActivityLogList: React.FC<ActivityLogListProps> = ({ onEdit, onAddNew }) => {
    const { logs, selectedDate, setSelectedDate, setIsCalendarVisible, setActiveTab, settings, updateSettings } = useApp();
    const [selectedCat, setSelectedCat] = useState<ActivityCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const getTodayLocalDateStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const todayStr = getTodayLocalDateStr();
    const activeDateStr = selectedDate || todayStr;

    // Cycle through dates by deltaDays (-1 = yesterday, +1 = tomorrow)
    const cycleDate = (deltaDays: number) => {
        const base = new Date(activeDateStr + 'T12:00:00');
        base.setDate(base.getDate() + deltaDays);
        const y = base.getFullYear();
        const m = String(base.getMonth() + 1).padStart(2, '0');
        const day = String(base.getDate()).padStart(2, '0');
        setSelectedDate(`${y}-${m}-${day}`);
    };

    // Route to the Monthly Activity Calendar on the Tools & Metrics tab
    const bringUpCalendar = () => {
        setIsCalendarVisible(true);
        setActiveTab('metrics');

        // Unhide calendar if it was removed in layout customization on Tools & Metrics
        if (settings.hiddenMetricsSections?.includes('calendar')) {
            updateSettings({
                hiddenMetricsSections: settings.hiddenMetricsSections.filter(s => s !== 'calendar')
            });
        }

        // Smoothly scroll to the calendar on the Tools & Metrics page and trigger pulse highlight
        setTimeout(() => {
            const calEl = document.getElementById('monthly-activity-calendar') || document.getElementById('section-calendar');
            if (calEl) {
                calEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                calEl.classList.add('calendar-pulse');
                setTimeout(() => {
                    calEl.classList.remove('calendar-pulse');
                }, 1800);
            }
        }, 150);
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

        const dt = new Date(dateStr + 'T12:00:00');
        return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const categories: { id: ActivityCategory | 'all'; label: string }[] = [
        { id: 'all', label: 'All Activities' },
        { id: 'feeding', label: '🍼 Feeds' },
        { id: 'pumping', label: '💧 Pumping' },
        { id: 'diaper', label: '✨ Diapers' },
        { id: 'sleep', label: '🌙 Sleep' },
        { id: 'health', label: '💊 Health & Vitals' },
        { id: 'tummy', label: '🐢 Tummy' },
        { id: 'growth', label: '📏 Growth' },
        { id: 'bath', label: '🛁 Bath' },
        { id: 'other', label: '📝 Other' }
    ];

    const filtered = logs.filter(l => {
        if (selectedDate && l.dateStr !== selectedDate) return false;
        if (selectedCat !== 'all' && l.category !== selectedCat) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const noteMatch = (l.notes || '').toLowerCase().includes(q);
            const catMatch = l.category.toLowerCase().includes(q);
            return noteMatch || catMatch;
        }
        return true;
    });

    const activeFilterCount = (selectedCat !== 'all' ? 1 : 0) + (selectedDate ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

    // Group logs by dateStr
    const groupedByDate: { [date: string]: ActivityLog[] } = {};
    filtered.forEach(l => {
        if (!groupedByDate[l.dateStr]) groupedByDate[l.dateStr] = [];
        groupedByDate[l.dateStr].push(l);
    });

    const dates = Object.keys(groupedByDate).sort().reverse();

    return (
        <div>
            {/* Controls Bar: Filter Button & Log Button */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        id="btn-activity-filter"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="surface-elevated"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            border: isFilterOpen || activeFilterCount > 0 ? '1.5px solid var(--primary-accent)' : '1px solid var(--border-color)',
                            backgroundColor: activeFilterCount > 0 ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-surface-elevated)',
                            color: activeFilterCount > 0 ? 'var(--primary-accent)' : 'var(--text-primary)',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.06)'
                        }}
                    >
                        <Filter size={15} />
                        <span>Filter</span>
                        {activeFilterCount > 0 && (
                            <span style={{
                                backgroundColor: 'var(--primary-accent)',
                                color: '#fff',
                                borderRadius: '10px',
                                padding: '1px 6px',
                                fontSize: '10px',
                                fontWeight: 800
                            }}>
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {/* Active Filter Badges */}
                    {selectedCat !== 'all' && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            color: 'var(--text-primary)',
                            fontSize: '11px',
                            fontWeight: 700
                        }}>
                            <span>{categories.find(c => c.id === selectedCat)?.label || selectedCat}</span>
                            <button
                                onClick={() => setSelectedCat('all')}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                aria-label="Clear category filter"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {searchQuery.trim() && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: 'var(--text-primary)',
                            fontSize: '11px',
                            fontWeight: 700
                        }}>
                            <span>"{searchQuery}"</span>
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                aria-label="Clear search filter"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {selectedDate && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: 'var(--text-primary)',
                            fontSize: '11px',
                            fontWeight: 700
                        }}>
                            <span>{selectedDate}</span>
                            <button
                                onClick={() => setSelectedDate(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                aria-label="Clear date filter"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                </div>

                <button onClick={onAddNew} className="btn-primary" style={{ padding: '6px 14px', borderRadius: '10px' }}>
                    <Plus size={16} />
                    <span>Log New Activity</span>
                </button>
            </div>

            {/* Filter Dropdown / Card */}
            {isFilterOpen && (
                <div className="surface-card" style={{
                    padding: '14px',
                    borderRadius: '14px',
                    border: '1.5px solid var(--primary-accent)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    marginBottom: '16px',
                    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.25)',
                    animation: 'fadeIn 0.15s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Filter size={15} style={{ color: 'var(--primary-accent)' }} />
                            <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Filter Activities</strong>
                        </div>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={() => {
                                    setSelectedCat('all');
                                    setSearchQuery('');
                                    setSelectedDate(null);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                Reset All Filters
                            </button>
                        )}
                    </div>

                    {/* Type Filter / Search Box */}
                    <div style={{ position: 'relative', width: '100%', marginBottom: '12px' }}>
                        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Type to filter notes or keywords..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field"
                            style={{ paddingLeft: '32px', fontSize: '12px', height: '34px', width: '100%' }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Category Selection Grid */}
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Select Category
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                        gap: '6px',
                        marginBottom: '12px'
                    }}>
                        {categories.map(c => {
                            const isSelected = selectedCat === c.id;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedCat(c.id)}
                                    style={{
                                        padding: '5px 8px',
                                        borderRadius: '8px',
                                        border: isSelected ? '1.5px solid var(--primary-accent)' : '1px solid var(--border-color)',
                                        background: isSelected ? 'var(--primary-accent)' : 'var(--bg-surface)',
                                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    {c.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Close / Apply Button */}
                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="btn-primary"
                        style={{ width: '100%', height: '32px', fontSize: '12px', borderRadius: '8px' }}
                    >
                        Apply Filters ({filtered.length} Results)
                    </button>
                </div>
            )}

            {/* Date Cycling & Calendar Trigger Bar (Requirement 1 & 2) */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                marginBottom: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                        id="btn-nav-prev-day"
                        onClick={() => cycleDate(-1)}
                        title="Previous day"
                        aria-label="Previous day"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
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

                    {/* Date click/tab trigger button (Requirement 2) */}
                    <button
                        id="btn-open-calendar-date-box"
                        onClick={bringUpCalendar}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                bringUpCalendar();
                            }
                        }}
                        tabIndex={0}
                        title="Click or press Tab/Enter to open Calendar view"
                        aria-label={`Current date ${activeDateStr}. Click or press Enter to view Monthly Calendar`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            backgroundColor: 'rgba(245, 158, 11, 0.10)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 800,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <CalendarDays size={15} style={{ color: '#f59e0b' }} />
                        <span>{activeDateStr}</span>
                        <span style={{
                            fontSize: '11px',
                            padding: '1px 6px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(245, 158, 11, 0.25)',
                            color: '#b45309',
                            fontWeight: 700
                        }}>
                            {getRelativeLabel(activeDateStr)}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            (open calendar 🗓️)
                        </span>
                    </button>

                    <button
                        id="btn-nav-next-day"
                        onClick={() => cycleDate(1)}
                        title="Next day"
                        aria-label="Next day"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
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
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {activeDateStr !== todayStr && (
                        <button
                            onClick={() => setSelectedDate(todayStr)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-surface-elevated)',
                                color: 'var(--text-secondary)',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                            title="Jump to today"
                        >
                            <RotateCcw size={11} />
                            <span>Today</span>
                        </button>
                    )}
                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate(null)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                border: '1px dashed var(--border-color)',
                                backgroundColor: 'transparent',
                                color: 'var(--text-muted)',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                            title="Show all activity dates without day filter"
                        >
                            <X size={11} />
                            <span>Clear Day Filter</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Log Stream Grouped by Date */}
            {dates.length === 0 ? (
                <div className="surface-card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍼</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {selectedDate ? `No tracked activities on ${selectedDate}` : 'No tracked activities recorded yet'}
                    </div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>
                        {selectedDate ? (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                                <button
                                    onClick={() => cycleDate(-1)}
                                    className="btn-ghost"
                                    style={{ fontSize: '12px', padding: '6px 12px' }}
                                >
                                    <ChevronLeft size={13} style={{ marginRight: '4px' }} />
                                    Prev Day
                                </button>
                                <button
                                    id="btn-open-calendar-empty-view"
                                    onClick={bringUpCalendar}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                        color: '#d97706',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <CalendarDays size={13} />
                                    <span>Open Calendar View</span>
                                </button>
                                <button
                                    onClick={() => cycleDate(1)}
                                    className="btn-ghost"
                                    style={{ fontSize: '12px', padding: '6px 12px' }}
                                >
                                    Next Day
                                    <ChevronRight size={13} style={{ marginLeft: '4px' }} />
                                </button>
                            </div>
                        ) : (
                            'Use the Quick Activity Pad above or click "Log New Activity" to record a feed, diaper, or nap!'
                        )}
                    </div>
                    {selectedDate && (
                        <div style={{ marginTop: '10px' }}>
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="btn-ghost"
                                style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700 }}
                            >
                                Tap to view activities from all days
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                dates.map(dStr => (
                    <div key={dStr} style={{ marginBottom: '20px' }}>
                        {/* Interactive Clickable & Tabbable Date Header (Requirement 2) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <button
                                type="button"
                                onClick={bringUpCalendar}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        bringUpCalendar();
                                    }
                                }}
                                tabIndex={0}
                                title="Click or press Tab/Enter to view in Monthly Calendar"
                                aria-label={`Date ${dStr}. Click or press Enter to view Monthly Calendar`}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px 8px',
                                    margin: '0 0 0 -4px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    letterSpacing: '0.5px',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--primary-accent)';
                                    e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <span>{dStr}</span>
                                <span style={{ fontSize: '11px', opacity: 0.8, textTransform: 'none', fontWeight: 600 }}>
                                    ({getRelativeLabel(dStr)})
                                </span>
                                <CalendarDays size={13} style={{ opacity: 0.7 }} />
                            </button>
                        </div>
                        {groupedByDate[dStr].map(log => (
                            <ActivityCard key={log.id} log={log} onEdit={onEdit} />
                        ))}
                    </div>
                ))
            )}
        </div>
    );
};
