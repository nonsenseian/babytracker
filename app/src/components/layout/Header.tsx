import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../types/state';
import { Scale, ChevronDown, Settings as SettingsIcon, X, Users, Bell } from 'lucide-react';

export interface ClinicalNotification {
    id: string;
    title: string;
    message: string;
    tag: string;
    timestamp: string;
    isRead: boolean;
    icon: string;
    type?: 'welcome' | 'appointment' | 'feed' | 'streak';
    actionPayload?: {
        date?: string;
        id?: string;
    };
}

const WELCOME_NOTIFICATION: ClinicalNotification = {
    id: 'notif_welcome',
    title: "Welcome to NovaBaby! 👋",
    message: "Tap here to explore your Notification Center and see how alerts keep you informed on appointments, feeding times, and pediatric milestones.",
    tag: "✨ Notification Center",
    timestamp: "Just now",
    isRead: false,
    icon: "👋",
    type: 'welcome'
};

const getDaysDifference = (dateStr: string): number => {
    try {
        if (!dateStr) return -999;
        const [year, month, day] = dateStr.split('-').map(Number);
        if (!year || !month || !day) return -999;
        const aptDate = new Date(year, month - 1, day);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffMs = aptDate.getTime() - today.getTime();
        return Math.round(diffMs / (1000 * 60 * 60 * 24));
    } catch {
        return -999;
    }
};

interface HeaderProps {
    onOpenChildModal: () => void;
    onOpenSettings?: () => void;
    onOpenVoice?: () => void;
    onOpenCouplesSync?: () => void;
    onOpenDoctorDossier?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    onOpenChildModal,
    onOpenSettings,
    onOpenCouplesSync,
    onOpenDoctorDossier
}) => {
    const {
        activeChild,
        children,
        setActiveChildId,
        caregivers,
        caregiverShift,
        handOffShift,
        unit,
        setUnit,
        streakDays,
        appointments,
        logs,
        setActiveTab,
        setIsCalendarVisible,
        setSelectedDate
    } = useApp();
    const { theme, setTheme } = useTheme();

    const [childDropdownOpen, setChildDropdownOpen] = useState(false);
    const [caregiverDropdownOpen, setCaregiverDropdownOpen] = useState(false);
    const [streakTooltipOpen, setStreakTooltipOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [isIntroGuideOpen, setIsIntroGuideOpen] = useState(false);

    const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('bt_dismissed_notifications_v2');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [readIds, setReadIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('bt_read_notifications_v2');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Cleanup legacy notifications v1 mock cache (removes phantom 2-month checkup artifact)
    useEffect(() => {
        try {
            localStorage.removeItem('babytracker_notifications_v1');
        } catch {}
    }, []);

    // Dynamically derive notifications strictly relevant to dashboard items
    const notifications = React.useMemo<ClinicalNotification[]>(() => {
        const list: ClinicalNotification[] = [];

        // 1. Initial Welcome Notification (active until dismissed by user)
        if (!dismissedIds.includes('notif_welcome')) {
            list.push({
                ...WELCOME_NOTIFICATION,
                isRead: readIds.includes('notif_welcome')
            });
        }

        // 2. Real Calendar Appointments from User Dashboard
        if (Array.isArray(appointments)) {
            appointments.forEach(apt => {
                const notifId = `apt_${apt.id}`;
                if (dismissedIds.includes(notifId)) return;

                const daysUntil = getDaysDifference(apt.date);
                if (daysUntil < 0 || daysUntil > 14) return; // Only upcoming within 14 days or today

                const isToday = daysUntil === 0;
                const isTomorrow = daysUntil === 1;

                list.push({
                    id: notifId,
                    title: isToday ? `Today: ${apt.title} 🩺` : `Upcoming: ${apt.title} 🗓️`,
                    message: isToday
                        ? `Appointment today at ${apt.time || '10:00 AM'}${apt.doctorName ? ` with ${apt.doctorName}` : ''}${apt.location ? ` (${apt.location})` : ''}. Tap to view calendar.`
                        : `Scheduled for ${apt.date} at ${apt.time || '10:00 AM'}${apt.doctorName ? ` with ${apt.doctorName}` : ''}${apt.location ? ` (${apt.location})` : ''}. Tap to open calendar.`,
                    tag: isToday ? "🗓️ Today's Visit" : (isTomorrow ? "🗓️ Tomorrow" : `🗓️ In ${daysUntil} days`),
                    timestamp: isToday ? `Today at ${apt.time || '10:00 AM'}` : (isTomorrow ? 'Tomorrow' : `In ${daysUntil} days`),
                    isRead: readIds.includes(notifId),
                    icon: isToday ? "🩺" : "🗓️",
                    type: 'appointment',
                    actionPayload: { date: apt.date, id: apt.id }
                });
            });
        }

        // 3. Real Feeding Overdue Reminder from User Logs on Dashboard
        if (Array.isArray(logs) && activeChild) {
            const feedLogs = logs.filter(l => l.category === 'feeding' && (!l.childId || l.childId === activeChild.id));
            if (feedLogs.length > 0) {
                const latestFeed = feedLogs.reduce((latest, l) => l.timestamp > latest.timestamp ? l : latest, feedLogs[0]);
                const hoursSince = (Date.now() - latestFeed.timestamp) / (1000 * 60 * 60);
                if (hoursSince >= 3.5 && hoursSince < 12) {
                    const feedNotifId = `feed_due_${Math.floor(latestFeed.timestamp / (1000 * 60 * 60 * 3))}`;
                    if (!dismissedIds.includes(feedNotifId)) {
                        const hours = Math.floor(hoursSince);
                        const mins = Math.round((hoursSince % 1) * 60);
                        list.push({
                            id: feedNotifId,
                            title: "Feeding Due Reminder 🍼",
                            message: `It has been over ${hours}h ${mins}m since ${activeChild.name}'s last feeding. Tap to open quick log.`,
                            tag: "🍼 Feeding Window",
                            timestamp: "Overdue",
                            isRead: readIds.includes(feedNotifId),
                            icon: "🍼",
                            type: 'feed'
                        });
                    }
                }
            }
        }

        // 4. Care Logging Streak Milestone
        if (streakDays >= 3) {
            const streakNotifId = `streak_${streakDays}`;
            if (!dismissedIds.includes(streakNotifId)) {
                list.push({
                    id: streakNotifId,
                    title: `${streakDays}-Day Logging Streak! 🔥`,
                    message: `You've kept active daily care logs for ${streakDays} days straight! Keep up the great routine.`,
                    tag: "🏆 Care Streak",
                    timestamp: "Active Streak",
                    isRead: readIds.includes(streakNotifId),
                    icon: "🔥",
                    type: 'streak'
                });
            }
        }

        return list;
    }, [dismissedIds, readIds, appointments, logs, activeChild, streakDays]);

    const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = (id: string) => {
        setReadIds(prev => {
            if (prev.includes(id)) return prev;
            const next = [...prev, id];
            try {
                localStorage.setItem('bt_read_notifications_v2', JSON.stringify(next));
            } catch {}
            return next;
        });
    };

    const markAllNotificationsAsRead = () => {
        const allIds = notifications.map(n => n.id);
        setReadIds(prev => {
            const next = Array.from(new Set([...prev, ...allIds]));
            try {
                localStorage.setItem('bt_read_notifications_v2', JSON.stringify(next));
            } catch {}
            return next;
        });
    };

    const dismissNotification = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setDismissedIds(prev => {
            const next = Array.from(new Set([...prev, id]));
            try {
                localStorage.setItem('bt_dismissed_notifications_v2', JSON.stringify(next));
            } catch {}
            return next;
        });
    };

    const handleNotificationClick = (notif: ClinicalNotification) => {
        markAsRead(notif.id);

        if (notif.id === 'notif_welcome') {
            setIsIntroGuideOpen(prev => !prev);
            return;
        }

        if (notif.type === 'appointment') {
            setActiveTab('metrics');
            setIsCalendarVisible(true);
            if (notif.actionPayload?.date) {
                setSelectedDate(notif.actionPayload.date);
            }
            setNotificationsOpen(false);
            setTimeout(() => {
                const el = document.getElementById('appointments-card') || document.getElementById('section-appointments') || document.getElementById('interactive-calendar');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
            return;
        }

        if (notif.type === 'feed') {
            setActiveTab('tracker');
            setNotificationsOpen(false);
            setTimeout(() => {
                const el = document.getElementById('quick-logging-pad');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
            return;
        }
    };

    const childRef = useRef<HTMLDivElement>(null);
    const caregiverRef = useRef<HTMLDivElement>(null);
    const streakRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const hasCaregivers = caregivers.length > 0;
    const hasChildren = children.length > 0;
    const activeCaregiver = caregivers.find(c => c.id === caregiverShift.activeCaregiverId) || caregivers[0] || { id: '', name: 'No Caregiver Set', emoji: '🧑', role: 'None' };

    // Close popovers on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const targetNode = e.target as Node;
            if (streakRef.current && !streakRef.current.contains(targetNode)) {
                setStreakTooltipOpen(false);
            }
            if (childRef.current && !childRef.current.contains(targetNode)) {
                setChildDropdownOpen(false);
            }
            if (caregiverRef.current && !caregiverRef.current.contains(targetNode)) {
                setCaregiverDropdownOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(targetNode)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const themesList: { id: AppTheme; label: string }[] = [
        { id: 'simple-daylight', label: 'Light' },
        { id: 'simple-moonlight', label: 'Dark' },
        { id: 'soft-pastel', label: 'Pastel' },
        { id: 'forest-sage', label: 'Forest' },
        { id: 'high-contrast-dark', label: 'High contrast Dark' },
        { id: 'vintage-warmth', label: 'Soil' },
        { id: 'pixelated-arcade', label: 'Arcade' }
    ];

    // Calculate milestone incentive text
    const nextMilestoneDays = streakDays < 7 ? 7 : (streakDays < 14 ? 14 : (streakDays < 30 ? 30 : streakDays + 10));
    const daysUntilMilestone = Math.max(1, nextMilestoneDays - streakDays);
    const milestoneTitle = nextMilestoneDays === 7 ? '🥉 7-Day Routine Star' : (nextMilestoneDays === 14 ? '🥈 14-Day Pro Parent' : '🥇 30-Day Newborn Legend');

    return (
        <header className="app-header" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-color)'
        }}>
            {/* Main Top Row: Left Logo, Center Dual Dropdowns, Right Quick Settings */}
            <div className="header-main-row" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                width: '100%'
            }}>
                {/* Left: App Logo & Title (Child dropdown moved to center) */}
                <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div className="header-logo-badge" style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: 'var(--primary-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                        flexShrink: 0
                    }}>
                        <img
                            src="/icon-512.svg"
                            alt="NovaBaby Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                    <h1 style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.5px', margin: 0, lineHeight: 1 }}>NovaBaby</h1>
                </div>

                {/* Center: Dual Interactive Dropdown Switcher Boxes */}
                <div className="header-center-dropdowns" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                    flex: '1 1 auto'
                }}>
                    {/* Dropdown Box 1: Active Child */}
                    <div ref={childRef} style={{ position: 'relative' }}>
                        <button
                            type="button"
                            id="header-active-child-btn"
                            onClick={() => {
                                if (!hasChildren) {
                                    onOpenChildModal();
                                    return;
                                }
                                setChildDropdownOpen(!childDropdownOpen);
                                setCaregiverDropdownOpen(false);
                                setNotificationsOpen(false);
                            }}
                            className="surface-elevated"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '7px 12px',
                                borderRadius: '12px',
                                border: childDropdownOpen ? '1.5px solid var(--primary-accent)' : '1px solid var(--border-color)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                minWidth: '130px',
                                transition: 'all 0.15s ease',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                            }}
                            aria-expanded={childDropdownOpen}
                            aria-label={hasChildren ? `Active Child: ${activeChild.name}. Click to switch child.` : 'No child profile. Click to add child.'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                                <span style={{ fontSize: '16px', flexShrink: 0 }}>{hasChildren ? (activeChild.avatarEmoji || '👶') : '👶'}</span>
                                <span className="dropdown-inner-text" style={{ fontSize: '13px', fontWeight: 800, color: hasChildren ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                    {hasChildren ? activeChild.name : '+ Add Child'}
                                </span>
                            </div>
                            <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: '4px' }} />
                        </button>

                        {childDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '110%',
                                left: 0,
                                zIndex: 70,
                                minWidth: '200px',
                                backgroundColor: 'var(--bg-surface-elevated, #1e293b)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '14px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                                padding: '6px',
                                animation: 'fadeIn 0.15s ease'
                            }}>
                                <div style={{
                                    padding: '4px 8px 6px 8px',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    color: 'var(--text-muted)',
                                    borderBottom: '1px solid var(--border-color)',
                                    marginBottom: '4px'
                                }}>
                                    Select Active Child ({children.length}/6)
                                </div>
                                {children.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            setActiveChildId(c.id);
                                            setChildDropdownOpen(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 10px',
                                            background: c.id === activeChild.id ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontWeight: 700,
                                            fontSize: '13px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>{c.avatarEmoji || '👶'}</span>
                                            <span>{c.name}</span>
                                        </div>
                                        {c.id === activeChild.id && (
                                            <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 800 }}>ACTIVE</span>
                                        )}
                                    </button>
                                ))}
                                <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                                <button
                                    disabled={children.length >= 6}
                                    onClick={() => {
                                        if (children.length >= 6) return;
                                        setChildDropdownOpen(false);
                                        onOpenChildModal();
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: children.length >= 6 ? 'var(--text-muted)' : 'var(--primary-accent)',
                                        cursor: children.length >= 6 ? 'not-allowed' : 'pointer',
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        textAlign: 'left',
                                        opacity: children.length >= 6 ? 0.6 : 1
                                    }}
                                >
                                    {children.length >= 6 ? 'Max 6 Children (Pro Cap)' : '+ Add Child Profile'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Dropdown Box 2: Active Caregiver */}
                    <div ref={caregiverRef} style={{ position: 'relative' }}>
                        <button
                            type="button"
                            id="header-active-caregiver-btn"
                            onClick={() => {
                                setCaregiverDropdownOpen(!caregiverDropdownOpen);
                                setChildDropdownOpen(false);
                                setNotificationsOpen(false);
                            }}
                            className="surface-elevated"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '7px 12px',
                                borderRadius: '12px',
                                border: caregiverDropdownOpen ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                minWidth: '130px',
                                transition: 'all 0.15s ease',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                            }}
                            aria-expanded={caregiverDropdownOpen}
                            aria-label={hasCaregivers ? `Active Caregiver: ${activeCaregiver.name}. Click to hand off shift.` : 'Care Team: Empty.'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                                <span style={{ fontSize: '16px', flexShrink: 0 }}>{hasCaregivers ? (activeCaregiver.emoji || '🧑') : '🧑‍🍼'}</span>
                                <span className="dropdown-inner-text" style={{ fontSize: '13px', fontWeight: 800, color: hasCaregivers ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                    {hasCaregivers ? activeCaregiver.name : 'Care Team'}
                                </span>
                            </div>
                            <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: '4px' }} />
                        </button>

                        {caregiverDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '110%',
                                left: 0,
                                zIndex: 70,
                                minWidth: '200px',
                                backgroundColor: 'var(--bg-surface-elevated, #1e293b)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '14px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                                padding: '6px',
                                animation: 'fadeIn 0.15s ease'
                            }}>
                                <div style={{
                                    padding: '4px 8px 6px 8px',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    color: 'var(--text-muted)',
                                    borderBottom: '1px solid var(--border-color)',
                                    marginBottom: '4px'
                                }}>
                                    Switch Caregiver on Duty
                                </div>
                                {!hasCaregivers ? (
                                    <div style={{ padding: '10px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        No care team members designated yet. Designate caregivers in the Profile tab.
                                    </div>
                                ) : (
                                    caregivers.map(cg => {
                                        const isDuty = cg.id === activeCaregiver.id;
                                        return (
                                            <button
                                                key={cg.id}
                                                onClick={() => {
                                                    handOffShift(cg.id);
                                                    setCaregiverDropdownOpen(false);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 10px',
                                                    background: isDuty ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    color: 'var(--text-primary)',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    fontWeight: 700,
                                                    fontSize: '13px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>{cg.emoji || '🧑'}</span>
                                                    <div>
                                                        <div style={{ fontWeight: 800 }}>{cg.name}</div>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{cg.role}</div>
                                                    </div>
                                                </div>
                                                {isDuty && (
                                                    <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>ON DUTY</span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Unit Toggle, Theme Switcher, Notifications, Settings Gear */}
                <div className="header-quick-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {/* Unit Switcher */}
                    <button
                        onClick={() => setUnit(unit === 'mL' ? 'oz' : 'mL')}
                        className="btn-ghost"
                        title="Toggle mL / oz"
                        aria-label={`Toggle measurement unit. Currently ${unit}`}
                        style={{ padding: '5px 7px', borderRadius: '10px' }}
                    >
                        <Scale size={13} />
                        <span style={{ fontWeight: 700, fontSize: '11px' }}>{unit}</span>
                    </button>

                    {/* Theme Switcher */}
                    <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as AppTheme)}
                        aria-label="Theme selector"
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            padding: '5px 6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none',
                            maxWidth: '105px',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {themesList.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>

                    {/* Notifications Button with Bell Icon & Flyout */}
                    <div ref={notificationsRef} style={{ position: 'relative' }}>
                        <button
                            id="btn-header-notifications"
                            type="button"
                            onClick={() => {
                                setNotificationsOpen(!notificationsOpen);
                                setChildDropdownOpen(false);
                                setCaregiverDropdownOpen(false);
                            }}
                            className="btn-ghost"
                            title="Notifications & Key Insights"
                            aria-label={`Notifications and Key Insights. ${unreadNotificationsCount} unread.`}
                            style={{
                                padding: '6px 8px',
                                borderRadius: '10px',
                                backgroundColor: notificationsOpen ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)',
                                color: notificationsOpen ? 'var(--primary-accent)' : 'var(--text-primary)',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: notificationsOpen ? '1px solid var(--primary-accent)' : '1px solid var(--border-color)',
                                cursor: 'pointer'
                            }}
                        >
                            <Bell size={15} />
                            {unreadNotificationsCount > 0 && (
                                <span
                                    id="notifications-badge"
                                    style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        right: '-4px',
                                        minWidth: '15px',
                                        height: '15px',
                                        padding: '0 4px',
                                        borderRadius: '999px',
                                        backgroundColor: '#ef4444',
                                        color: '#ffffff',
                                        fontSize: '9px',
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: 1,
                                        boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)'
                                    }}
                                >
                                    {unreadNotificationsCount}
                                </span>
                            )}
                        </button>

                        {notificationsOpen && (
                            <div
                                id="header-notifications-flyout"
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    width: 'min(360px, calc(100vw - 32px))',
                                    maxHeight: '440px',
                                    overflowY: 'auto',
                                    backgroundColor: 'var(--bg-surface-elevated, #1e293b)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '16px',
                                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
                                    zIndex: 90,
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    animation: 'fadeIn 0.15s ease'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                            Insights & Alerts
                                        </span>
                                        {unreadNotificationsCount > 0 && (
                                            <span style={{
                                                fontSize: '10px',
                                                fontWeight: 800,
                                                padding: '1px 6px',
                                                borderRadius: '999px',
                                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                color: '#ef4444',
                                                border: '1px solid rgba(239, 68, 68, 0.3)'
                                            }}>
                                                {unreadNotificationsCount} new
                                            </span>
                                        )}
                                    </div>
                                    {unreadNotificationsCount > 0 && (
                                        <button
                                            type="button"
                                            id="btn-mark-all-notifications-read"
                                            onClick={markAllNotificationsAsRead}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--primary-accent)',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                padding: '2px 4px'
                                            }}
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                {/* Interactive Notification Center Introduction Guide */}
                                {isIntroGuideOpen && (
                                    <div
                                        id="notification-center-intro-guide"
                                        style={{
                                            backgroundColor: 'rgba(56, 189, 248, 0.08)',
                                            border: '1px solid rgba(56, 189, 248, 0.3)',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            animation: 'fadeIn 0.2s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary-accent)' }}>
                                                ✨ Notification Center Guide
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setIsIntroGuideOpen(false)}
                                                aria-label="Close guide"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    fontWeight: 700
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                                            Notifications are strictly relevant to your active dashboard:
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--text-primary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                <span>🗓️</span>
                                                <span><strong>Scheduled Visits:</strong> Add appointments in your Calendar, and timely reminders will notify you here before the visit.</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                <span>🍼</span>
                                                <span><strong>Care Reminders:</strong> Alerts trigger when feeding or diaper intervals pass according to your routine.</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                <span>🏆</span>
                                                <span><strong>Routine Streaks:</strong> Celebrate milestone streaks as you log daily.</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                                            <button
                                                type="button"
                                                onClick={() => setIsIntroGuideOpen(false)}
                                                className="btn-primary"
                                                style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer' }}
                                            >
                                                Got it, thanks!
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {notifications.length === 0 ? (
                                    <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <div style={{ fontSize: '26px', marginBottom: '8px' }}>🎉</div>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>All caught up!</div>
                                        <div style={{ fontSize: '11px', marginTop: '4px', lineHeight: 1.4 }}>
                                            Only relevant alerts for your scheduled calendar appointments and care reminders will appear here.
                                        </div>
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleNotificationClick(notif);
                                                }
                                            }}
                                            className="notification-card-item"
                                            style={{
                                                display: 'flex',
                                                gap: '10px',
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                backgroundColor: notif.isRead ? 'var(--bg-surface)' : 'rgba(56, 189, 248, 0.08)',
                                                border: notif.isRead ? '1px solid var(--border-color)' : '1px solid rgba(56, 189, 248, 0.3)',
                                                transition: 'all 0.15s ease',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>{notif.icon}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                                                    <span style={{
                                                        fontSize: '12px',
                                                        fontWeight: notif.isRead ? 700 : 800,
                                                        color: 'var(--text-primary)',
                                                        lineHeight: 1.25
                                                    }}>
                                                        {notif.title}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => dismissNotification(notif.id, e)}
                                                        aria-label={`Dismiss notification: ${notif.title}`}
                                                        title="Dismiss"
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'var(--text-muted)',
                                                            cursor: 'pointer',
                                                            padding: '2px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                                <p style={{
                                                    fontSize: '11px',
                                                    color: 'var(--text-secondary)',
                                                    margin: '4px 0 6px 0',
                                                    lineHeight: 1.35
                                                }}>
                                                    {notif.message}
                                                </p>
                                                {notif.id === 'notif_welcome' && (
                                                    <div style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        color: 'var(--primary-accent)',
                                                        backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        marginBottom: '6px'
                                                    }}>
                                                        <span>{isIntroGuideOpen ? '📖 Hide Menu Guide' : 'ℹ️ Tap here to see how notifications work'}</span>
                                                    </div>
                                                )}
                                                {notif.type === 'appointment' && (
                                                    <div style={{
                                                        fontSize: '10px',
                                                        color: 'var(--primary-accent)',
                                                        fontWeight: 700,
                                                        marginBottom: '4px'
                                                    }}>
                                                        📅 Tap to view in Calendar →
                                                    </div>
                                                )}
                                                {notif.type === 'feed' && (
                                                    <div style={{
                                                        fontSize: '10px',
                                                        color: '#10b981',
                                                        fontWeight: 700,
                                                        marginBottom: '4px'
                                                    }}>
                                                        🍼 Tap to log feed →
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
                                                    <span style={{ color: 'var(--primary-accent)', fontWeight: 700 }}>{notif.tag}</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>{notif.timestamp}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Settings Gear Button */}
                    <button
                        id="btn-header-settings"
                        onClick={onOpenSettings}
                        className="btn-ghost"
                        title="Settings & Layout Customization"
                        aria-label="Settings and Layout Customization"
                        style={{
                            padding: '6px 8px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <SettingsIcon size={15} />
                    </button>
                </div>
            </div>

            {/* Second Row: Streak Badge & Utility Pills on Left (per Image 2) */}
            <div className="header-chips-ribbon" style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                touchAction: 'pan-x',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                gap: '8px',
                width: '100%',
                paddingBottom: '2px'
            }}>
                {/* Streak Badge with Fire Emoji & Interactive Hover/Tap Tooltip (Matches Image 2 & 4) */}
                <div
                    ref={streakRef}
                    style={{ position: 'relative', flexShrink: 0 }}
                    onMouseEnter={() => setStreakTooltipOpen(true)}
                    onMouseLeave={() => setStreakTooltipOpen(false)}
                >
                    <button
                        onClick={() => setStreakTooltipOpen(!streakTooltipOpen)}
                        aria-expanded={streakTooltipOpen}
                        aria-label={`Current logging streak: ${streakDays} days. Click for streak details and milestones.`}
                        title={`${streakDays}-Day Care Streak`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '20px',
                            backgroundColor: 'var(--badge-bg)',
                            color: 'var(--badge-text)',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}
                    >
                        <span style={{ fontSize: '12px', lineHeight: 1 }}>🔥</span>
                        <span>{streakDays}d</span>
                    </button>

                    {streakTooltipOpen && (
                        <div
                            role="tooltip"
                            style={{
                                position: 'absolute',
                                top: '120%',
                                left: 0,
                                zIndex: 100,
                                width: '280px',
                                padding: '14px',
                                borderRadius: '14px',
                                backgroundColor: 'var(--bg-surface-elevated, #1e293b)',
                                color: 'var(--text-primary, #fff)',
                                border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                                fontSize: '12px',
                                lineHeight: '1.5',
                                animation: 'fadeIn 0.15s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '16px' }}>🔥</span>
                                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                                        {streakDays}-Day Care Streak
                                    </strong>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setStreakTooltipOpen(false);
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                    aria-label="Close tooltip"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>
                                A daily streak tracks consecutive days of logging feedings, diapers, sleep, and care activities.
                            </p>

                            <div style={{
                                padding: '8px 10px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--bg-surface, #0f172a)',
                                border: '1px solid var(--border-color)',
                                marginBottom: '10px'
                            }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Next Reward Goal
                                </div>
                                <div style={{ fontWeight: 800, color: 'var(--primary-accent)', fontSize: '12px', marginTop: '2px' }}>
                                    {milestoneTitle}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    {daysUntilMilestone === 1 ? '1 more day to unlock!' : `${daysUntilMilestone} days of care remaining`}
                                </div>
                            </div>

                            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                                ⭐ Keep logging today to protect your streak!
                            </div>
                        </div>
                    )}
                </div>

                {/* Couples & Family Sync */}
                {onOpenCouplesSync && (
                    <button
                        onClick={onOpenCouplesSync}
                        className="btn-ghost"
                        title="Couples & Household Sync"
                        aria-label="Household Couples Sync"
                        id="btn-header-couples-sync"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '20px',
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}
                    >
                        <Users size={12} style={{ color: '#10b981' }} />
                        <span>Sync</span>
                    </button>
                )}

                {/* 1-Click Clinical Doctor Visit Dossier */}
                {onOpenDoctorDossier && (
                    <button
                        onClick={onOpenDoctorDossier}
                        className="btn-ghost"
                        title="1-Click Clinical Doctor Visit Dossier"
                        aria-label="Doctor Visit Dossier"
                        id="btn-header-doctor-dossier"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '20px',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}
                    >
                        <span>🩺</span>
                        <span>Summary</span>
                    </button>
                )}

                {/* 1-Tap Sound Machine Jump */}
                <button
                    type="button"
                    id="btn-header-jump-sound-machine"
                    onClick={() => {
                        const el = document.getElementById('section-sound-machine') || document.getElementById('block-sound-machine') || document.getElementById('soundMachineCard');
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            el.classList.add('sound-machine-highlight');
                            setTimeout(() => el.classList.remove('sound-machine-highlight'), 1800);
                        }
                    }}
                    className="btn-ghost"
                    title="Jump to Nursery Sound Machine"
                    aria-label="Jump to Nursery Sound Machine"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 10px',
                        borderRadius: '20px',
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        color: 'var(--primary-accent)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                    }}
                >
                    <span>🎵</span>
                    <span>Music</span>
                </button>
            </div>
        </header>
    );
};
