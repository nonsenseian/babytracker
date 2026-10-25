import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { ActivityLog } from '../types/log';
import type { ChildProfile, Caregiver } from '../types/profile';
import type { ActiveTab, MeasurementUnit, TimersState, AppSettings } from '../types/state';
import type { BabyAppointment } from '../types/appointment';
import type { CaregiverShiftState, ShiftProtocol } from '../types/shift';
import type { AuthSession } from '../types/auth';
import { syncService } from '../engines/syncEngine';
import { VoiceAssistant } from '../engines/voiceEngine';
import { AuthEngine } from '../engines/authEngine';
import { SoundEngine } from '../engines/soundMachine';

export function sanitizeInput(input?: string | null): string {
    if (!input || typeof input !== 'string') return '';
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
}

interface AppContextType {
    authSession: AuthSession | null;
    isAuthenticated: boolean;
    setAuthSession: (session: AuthSession | null) => void;
    login: (email: string, password: string) => Promise<{ success: boolean; session?: AuthSession; error?: string }>;
    signup: (email: string, password: string, displayName: string) => Promise<{ success: boolean; session?: AuthSession; error?: string }>;
    logout: () => void;
    changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
    deleteAccount: () => { success: boolean };
    activeChild: ChildProfile;
    children: ChildProfile[];
    logs: ActivityLog[];
    allLogs: ActivityLog[];
    unit: MeasurementUnit;
    activeTab: ActiveTab;
    timers: TimersState;
    caregivers: Caregiver[];
    appointments: BabyAppointment[];
    caregiverShift: CaregiverShiftState;
    selectedDate: string | null;
    isCalendarVisible: boolean;
    roomId: string;
    streakDays: number;
    settings: AppSettings;
    rateLimitWarning: string | null;
    clearRateLimitWarning: () => void;
    updateSettings: (partial: Partial<AppSettings>) => void;
    setActiveTab: (tab: ActiveTab) => void;
    setUnit: (unit: MeasurementUnit) => void;
    setSelectedDate: (date: string | null) => void;
    setIsCalendarVisible: (visible: boolean) => void;
    setRoomId: (room: string) => void;
    addLog: (log: Omit<ActivityLog, 'id' | 'timestamp' | 'dateStr'> & { dateStr?: string; timestamp?: number; childId?: string; skipAudioAnnouncement?: boolean }) => ActivityLog | null;
    updateLog: (log: ActivityLog) => void;
    deleteLog: (id: string) => void;
    addAppointment: (apt: Omit<BabyAppointment, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateAppointment: (apt: BabyAppointment) => void;
    deleteAppointment: (id: string) => void;
    setActiveChildId: (id: string) => void;
    saveChild: (child: ChildProfile) => { success: boolean; error?: string };
    deleteChild: (id: string) => { success: boolean; error?: string };
    saveCaregiver: (caregiver: Caregiver) => void;
    addCaregiver: (caregiver: Omit<Caregiver, 'id'>) => { success: boolean; error?: string };
    deleteCaregiver: (id: string) => { success: boolean; error?: string };
    startTimer: (timer: keyof TimersState) => void;
    pauseTimer: (timer: keyof TimersState) => void;
    resetTimer: (timer: keyof TimersState) => void;
    saveTimer: (timer: keyof TimersState) => void;
    resetDiscardMilkTimer: () => void;
    startDiscardMilkTimer: () => void;
    handOffShift: (nextCaregiverId: string, notes?: string) => void;
    addShiftProtocol: (text: string, category?: ShiftProtocol['category']) => void;
    removeShiftProtocol: (id: string) => void;
}

const initialTimers: TimersState = {
    feed: { isRunning: false, startTime: null, elapsedSeconds: 0, baseSeconds: 0, runningSince: null, discardMilkStartTime: null },
    pump: { isRunning: false, startTime: null, elapsedSeconds: 0, baseSeconds: 0, runningSince: null },
    sleep: { isRunning: false, startTime: null, elapsedSeconds: 0, baseSeconds: 0, runningSince: null },
    tummy: { isRunning: false, startTime: null, elapsedSeconds: 0, baseSeconds: 0, runningSince: null }
};

const defaultShiftState: CaregiverShiftState = {
    activeCaregiverId: '',
    shiftStartTime: Date.now(),
    pinnedProtocols: []
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
        return AuthEngine.getSession();
    });

    const isAuthenticated = !!authSession;

    const login = async (email: string, password: string) => {
        const res = await AuthEngine.login(email, password);
        if (res.success && res.session) {
            setAuthSession(res.session);
        }
        return res;
    };

    const signup = async (email: string, password: string, displayName: string) => {
        const res = await AuthEngine.signup(email, password, displayName);
        if (res.success && res.session) {
            setAuthSession(res.session);
        }
        return res;
    };

    const logout = () => {
        AuthEngine.logout();
        setAuthSession(null);
    };

    const changePassword = async (oldPass: string, newPass: string) => {
        return AuthEngine.changePassword(oldPass, newPass);
    };

    const deleteAccount = () => {
        const res = AuthEngine.deleteAccount();
        setAuthSession(null);
        return res;
    };

    const [childrenList, setChildrenList] = useState<ChildProfile[]>(() => {
        try {
            const saved = localStorage.getItem('bt_app_children');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    // Filter out legacy demo profiles
                    const clean = parsed.filter(p => p && p.name !== 'Baby Ian' && p.name !== 'Mark' && p.id !== 'child_1' && p.id !== 'child_2');
                    return clean.slice(0, 6);
                }
            }
        } catch (e) {}
        return [];
    });

    const [activeChildId, setActiveChildIdState] = useState<string>(() => {
        const saved = localStorage.getItem('bt_app_active_child_id');
        return (saved && saved !== 'child_1' && saved !== 'child_2') ? saved : '';
    });

    const [logs, setLogs] = useState<ActivityLog[]>(() => {
        try {
            const saved = localStorage.getItem('bt_app_logs');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [];
    });

    const [unit, setUnitState] = useState<MeasurementUnit>(() => {
        return (localStorage.getItem('bt_app_unit') as MeasurementUnit) || 'mL';
    });

    const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
        try {
            const tab = new URLSearchParams(window.location.search).get('tab') as ActiveTab;
            if (tab === 'tracker' || tab === 'metrics' || tab === 'profile') return tab;
        } catch (e) {}
        return 'tracker';
    });

    const [caregivers, setCaregivers] = useState<Caregiver[]>(() => {
        try {
            const saved = localStorage.getItem('bt_app_caregivers');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    // Filter out legacy demo caregivers
                    const clean = parsed.filter(c => c && !(c.id === 'cg_1' && c.name === 'Mom') && !(c.id === 'cg_2' && c.name === 'Dad'));
                    return clean.slice(0, 4);
                }
            }
        } catch (e) {}
        return [];
    });

    const [caregiverShift, setCaregiverShift] = useState<CaregiverShiftState>(() => {
        try {
            const saved = localStorage.getItem('bt_app_caregiver_shift');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    ...parsed,
                    activeCaregiverId: (parsed.activeCaregiverId === 'cg_1' || parsed.activeCaregiverId === 'cg_2') ? '' : (parsed.activeCaregiverId || ''),
                    pinnedProtocols: (parsed.pinnedProtocols || []).filter((p: any) => p && p.id !== 'p_1' && p.id !== 'p_2' && p.id !== 'p_3')
                };
            }
        } catch (e) {}
        return defaultShiftState;
    });

    const [childTimersMap, setChildTimersMap] = useState<Record<string, TimersState>>(() => {
        try {
            const saved = localStorage.getItem('bt_app_child_timers');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        try {
            const old = localStorage.getItem('bt_app_timers');
            if (old) {
                return { 'child_1': JSON.parse(old) };
            }
        } catch (e) {}
        return {
            'child_1': { ...initialTimers },
            'child_2': { ...initialTimers }
        };
    });

    const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
    const clearRateLimitWarning = () => setRateLimitWarning(null);

    const defaultSettings: AppSettings = {
        voiceReminders: true,
        reminderChimes: true,
        voiceTrigger: 'hey nova',
        defaultFeedVolume: 60,
        defaultFeedType: 'formula',
        defaultPumpAmount: 100,
        defaultNapMinutes: 60,
        defaultTummyMinutes: 5,
        feedIntervalHours: 3.0,
        pumpIntervalHours: 3.0,
        maxFeedTimerMinutes: 60,
        maxPumpTimerMinutes: 60,
        maxTummyTimerMinutes: 30,
        maxSleepTimerMinutes: 720,
        isLayoutEditMode: false,
        hiddenSections: [],
        sectionOrder: ['timers', 'quick-logging', 'timeline-ribbon', 'activity-log', 'sound-machine', 'sweet-nap'],
        quickLogOrder: ['pee', 'poop', 'feed', 'pump', 'sleep', 'medication', 'tummy', 'bath', 'vitals', 'growth', 'milestone', 'other'],
        hiddenQuickLogIds: [],
        pinnedQuickLogIds: ['pee', 'poop', 'feed'],
        isQuickLogCollapsed: false,
        timerOrder: ['feed', 'pump', 'sleep', 'tummy'],
        hiddenTimerIds: [],
        profileSectionOrder: ['family-profiles', 'caregiver-handoff', 'milestones'],
        hiddenProfileSections: [],
        metricsSectionOrder: ['trends', 'clinical-guidelines', 'formula-calculator', 'appointments', 'calendar'],
        hiddenMetricsSections: []
    };

    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const saved = localStorage.getItem('bt_app_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Ensure sectionOrder uses the updated default order if previously using legacy default
                if (parsed.sectionOrder && parsed.sectionOrder[0] === 'sweet-nap') {
                    parsed.sectionOrder = defaultSettings.sectionOrder;
                }
                // Migrate legacy voiceTrigger to 'hey nova'
                if (parsed.voiceTrigger === 'hey tracker') {
                    parsed.voiceTrigger = 'hey nova';
                }
                return { ...defaultSettings, ...parsed };
            }
        } catch (e) {}
        return defaultSettings;
    });

    const updateSettings = (partial: Partial<AppSettings>) => {
        setSettings(prev => {
            const next = { ...prev, ...partial };
            localStorage.setItem('bt_app_settings', JSON.stringify(next));
            return next;
        });
    };

    const settingsRef = useRef<AppSettings>(settings);
    settingsRef.current = settings;
    const addLogRef = useRef<any>(null);

    const getTodayLocalDateStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const [selectedDate, setSelectedDate] = useState<string | null>(getTodayLocalDateStr);
    const [isCalendarVisible, setIsCalendarVisibleState] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('bt_calendar_visible');
            if (saved !== null) return JSON.parse(saved);
        } catch (e) {}
        return true;
    });

    const setIsCalendarVisible = (visible: boolean) => {
        setIsCalendarVisibleState(visible);
        try {
            localStorage.setItem('bt_calendar_visible', JSON.stringify(visible));
        } catch (e) {}
    };

    const [roomId, setRoomIdState] = useState<string>(() => syncService.getRoomId());

    const [appointments, setAppointments] = useState<BabyAppointment[]>(() => {
        try {
            const saved = localStorage.getItem('bt_appointments');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    // Filter out legacy default checkup event
                    return parsed.filter(a => a && a.id !== 'apt_1' && !a.title?.includes('2-Month Well-Baby Checkup'));
                }
            }
        } catch (e) {}
        return [];
    });

    const addAppointment = (aptData: Omit<BabyAppointment, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (appointments.length >= 100) {
            setRateLimitWarning('⚠️ Appointment Limit Reached: Maximum 100 scheduled checkups and appointments stored.');
            return;
        }
        const newApt: BabyAppointment = {
            ...aptData,
            title: sanitizeInput(aptData.title).slice(0, 100) || 'Checkup',
            location: sanitizeInput(aptData.location || '').slice(0, 120),
            doctorName: sanitizeInput(aptData.doctorName || '').slice(0, 80),
            notes: sanitizeInput(aptData.notes || '').slice(0, 1000),
            durationMinutes: Math.min(480, Math.max(5, Number(aptData.durationMinutes) || 30)),
            id: 'apt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setAppointments(prev => [...prev, newApt]);
    };

    const updateAppointment = (updated: BabyAppointment) => {
        const sanitized: BabyAppointment = {
            ...updated,
            title: sanitizeInput(updated.title).slice(0, 100) || 'Checkup',
            location: sanitizeInput(updated.location || '').slice(0, 120),
            doctorName: sanitizeInput(updated.doctorName || '').slice(0, 80),
            notes: sanitizeInput(updated.notes || '').slice(0, 1000),
            durationMinutes: Math.min(480, Math.max(5, Number(updated.durationMinutes) || 30)),
            updatedAt: Date.now()
        };
        setAppointments(prev => prev.map(a => a.id === sanitized.id ? sanitized : a));
    };

    const deleteAppointment = (id: string) => {
        setAppointments(prev => prev.filter(a => a.id !== id));
    };

    const setRoomId = (newRoom: string) => {
        const sanitized = (newRoom || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
        if (sanitized.length >= 4) {
            syncService.setRoomId(sanitized);
            setRoomIdState(sanitized);
        }
    };

    // Save state changes to localStorage and broadcast via BroadcastChannel
    useEffect(() => {
        localStorage.setItem('bt_app_children', JSON.stringify(childrenList));
    }, [childrenList]);

    useEffect(() => {
        localStorage.setItem('bt_app_active_child_id', activeChildId);
    }, [activeChildId]);

    useEffect(() => {
        // Enforce maximum 3,000 historical logs in storage to prevent localStorage quota crash
        const cappedLogs = logs.length > 3000 ? logs.slice(0, 3000) : logs;
        localStorage.setItem('bt_app_logs', JSON.stringify(cappedLogs));
        syncService.broadcastState({ logs: cappedLogs, activeChildId, appointments, children: childrenList, caregivers });
    }, [logs, activeChildId]);

    useEffect(() => {
        localStorage.setItem('bt_appointments', JSON.stringify(appointments));
        syncService.broadcastState({ logs, activeChildId, appointments, children: childrenList, caregivers });
    }, [appointments]);

    useEffect(() => {
        localStorage.setItem('bt_app_unit', unit);
    }, [unit]);

    useEffect(() => {
        localStorage.setItem('bt_app_child_timers', JSON.stringify(childTimersMap));
    }, [childTimersMap]);

    useEffect(() => {
        localStorage.setItem('bt_app_caregivers', JSON.stringify(caregivers));
    }, [caregivers]);

    useEffect(() => {
        localStorage.setItem('bt_app_caregiver_shift', JSON.stringify(caregiverShift));
    }, [caregiverShift]);

    // Ingest incoming remote updates from partner
    useEffect(() => {
        const unsub = syncService.onRemoteUpdate((payload) => {
            if (!payload) return;
            if (Array.isArray(payload.logs)) {
                setLogs(prev => {
                    const map = new Map<string, ActivityLog>();
                    prev.forEach(l => { if (l && l.id) map.set(l.id, l); });
                    let hasNewOrUpdated = false;
                    payload.logs.forEach((l: ActivityLog) => {
                        if (l && l.id) {
                            const existing = map.get(l.id);
                            if (!existing) {
                                map.set(l.id, l);
                                hasNewOrUpdated = true;
                            } else {
                                const existingTime = existing.updatedAt || existing.timestamp || 0;
                                const newTime = l.updatedAt || l.timestamp || 0;
                                if (newTime > existingTime) {
                                    map.set(l.id, l);
                                    hasNewOrUpdated = true;
                                }
                            }
                        }
                    });
                    if (!hasNewOrUpdated) return prev;
                    return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                });
            }
            if (Array.isArray(payload.appointments)) {
                setAppointments(prev => {
                    const map = new Map<string, BabyAppointment>();
                    prev.forEach(a => { if (a && a.id) map.set(a.id, a); });
                    let hasNewOrUpdated = false;
                    payload.appointments.forEach((a: BabyAppointment) => {
                        if (a && a.id) {
                            const existing = map.get(a.id);
                            if (!existing) {
                                map.set(a.id, a);
                                hasNewOrUpdated = true;
                            } else {
                                const existingTime = existing.updatedAt || existing.createdAt || 0;
                                const newTime = a.updatedAt || a.createdAt || 0;
                                if (newTime > existingTime) {
                                    map.set(a.id, a);
                                    hasNewOrUpdated = true;
                                }
                            }
                        }
                    });
                    if (!hasNewOrUpdated) return prev;
                    return Array.from(map.values());
                });
            }
            if (Array.isArray(payload.children)) {
                setChildrenList(prev => {
                    const map = new Map<string, ChildProfile>();
                    prev.forEach(c => { if (c && c.id) map.set(c.id, c); });
                    let hasNewOrUpdated = false;
                    payload.children.forEach((c: ChildProfile) => {
                        if (c && c.id) {
                            const existing = map.get(c.id);
                            if (!existing || JSON.stringify(existing) !== JSON.stringify(c)) {
                                map.set(c.id, c);
                                hasNewOrUpdated = true;
                            }
                        }
                    });
                    if (!hasNewOrUpdated) return prev;
                    return Array.from(map.values());
                });
            }
            if (Array.isArray(payload.caregivers)) {
                setCaregivers(prev => {
                    const map = new Map<string, Caregiver>();
                    prev.forEach(cg => { if (cg && cg.id) map.set(cg.id, cg); });
                    let hasNewOrUpdated = false;
                    payload.caregivers.forEach((cg: Caregiver) => {
                        if (cg && cg.id) {
                            const existing = map.get(cg.id);
                            if (!existing || JSON.stringify(existing) !== JSON.stringify(cg)) {
                                map.set(cg.id, cg);
                                hasNewOrUpdated = true;
                            }
                        }
                    });
                    if (!hasNewOrUpdated) return prev;
                    return Array.from(map.values());
                });
            }
            if (payload.caregiverShift) {
                setCaregiverShift(payload.caregiverShift);
            }
            if (payload.childTimersMap) {
                setChildTimersMap(payload.childTimersMap);
            }
            if (payload.activeChildId) {
                setActiveChildIdState(payload.activeChildId);
            }
        });
        return () => unsub();
    }, []);

    // Live ticking timer effect (ticks running timers across all children with true Wall-Clock accuracy)
    useEffect(() => {
        const updateAllRunningTimers = () => {
            const now = Date.now();
            const curSettings = settingsRef.current;
            const cutoffConfigs: Record<keyof TimersState, { maxMinutes: number; maxSeconds: number; label: string }> = {
                feed: {
                    maxMinutes: curSettings.maxFeedTimerMinutes || 60,
                    maxSeconds: (curSettings.maxFeedTimerMinutes || 60) * 60,
                    label: 'Feed'
                },
                pump: {
                    maxMinutes: curSettings.maxPumpTimerMinutes || 60,
                    maxSeconds: (curSettings.maxPumpTimerMinutes || 60) * 60,
                    label: 'Pump'
                },
                tummy: {
                    maxMinutes: curSettings.maxTummyTimerMinutes || 30,
                    maxSeconds: (curSettings.maxTummyTimerMinutes || 30) * 60,
                    label: 'Tummy Time'
                },
                sleep: {
                    maxMinutes: curSettings.maxSleepTimerMinutes || 720,
                    maxSeconds: (curSettings.maxSleepTimerMinutes || 720) * 60,
                    label: 'Sleep'
                }
            };

            const autoCutoffEvents: Array<{
                childId: string;
                key: keyof TimersState;
                durationMinutes: number;
                startTime: number;
                label: string;
            }> = [];

            setChildTimersMap(prev => {
                let changed = false;
                const next = { ...prev };
                Object.keys(next).forEach(cId => {
                    const timers = { ...next[cId] };
                    let childChanged = false;
                    (Object.keys(timers) as (keyof TimersState)[]).forEach(k => {
                        const session = timers[k];
                        if (session && session.isRunning) {
                            const since = session.runningSince || session.startTime || now;
                            const base = Number.isFinite(session.baseSeconds) ? session.baseSeconds! : (Number.isFinite(session.elapsedSeconds) ? session.elapsedSeconds : 0);
                            const delta = Math.floor((now - since) / 1000);
                            let exactElapsed = base + (Number.isFinite(delta) ? Math.max(0, delta) : 0);

                            const config = cutoffConfigs[k];
                            const ceiling = config ? config.maxSeconds : 3600;

                            if (exactElapsed >= ceiling) {
                                // Cutoff reached: automatically stop, cut itself off, reset timer to 0, and record cutoff event
                                timers[k] = {
                                    isRunning: false,
                                    startTime: null,
                                    elapsedSeconds: 0,
                                    baseSeconds: 0,
                                    runningSince: null,
                                    discardMilkStartTime: k === 'feed' ? null : session.discardMilkStartTime
                                };
                                childChanged = true;
                                autoCutoffEvents.push({
                                    childId: cId,
                                    key: k,
                                    durationMinutes: config.maxMinutes,
                                    startTime: session.startTime || (now - ceiling * 1000),
                                    label: config.label
                                });
                            } else if (session.elapsedSeconds !== exactElapsed || !session.runningSince) {
                                timers[k] = {
                                    ...session,
                                    isRunning: true,
                                    baseSeconds: base,
                                    runningSince: since,
                                    elapsedSeconds: exactElapsed
                                };
                                childChanged = true;
                            }
                        }
                    });
                    if (childChanged) {
                        next[cId] = timers;
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });

            // Process auto-cutoff sessions: log into activity history, alert user, and play chime
            if (autoCutoffEvents.length > 0 && addLogRef.current) {
                autoCutoffEvents.forEach(evt => {
                    if (evt.key === 'feed') {
                        addLogRef.current({
                            childId: evt.childId,
                            category: 'feeding',
                            durationMinutes: evt.durationMinutes,
                            subType: curSettings.defaultFeedType || 'formula',
                            amountMl: curSettings.defaultFeedVolume || 60,
                            timestamp: evt.startTime,
                            notes: `Feed session auto-stopped & logged (reached ${evt.durationMinutes}m safety cutoff)`,
                            skipAudioAnnouncement: true
                        });
                    } else if (evt.key === 'pump') {
                        addLogRef.current({
                            childId: evt.childId,
                            category: 'pumping',
                            durationMinutes: evt.durationMinutes,
                            amountMl: curSettings.defaultPumpAmount || 100,
                            timestamp: evt.startTime,
                            notes: `Pumping session auto-stopped & logged (reached ${evt.durationMinutes}m safety cutoff)`,
                            skipAudioAnnouncement: true
                        });
                    } else if (evt.key === 'sleep') {
                        addLogRef.current({
                            childId: evt.childId,
                            category: 'sleep',
                            durationMinutes: evt.durationMinutes,
                            isNightSleep: false,
                            timestamp: evt.startTime,
                            notes: `Sleep session auto-stopped & logged (reached ${evt.durationMinutes}m safety cutoff)`,
                            skipAudioAnnouncement: true
                        });
                    } else if (evt.key === 'tummy') {
                        addLogRef.current({
                            childId: evt.childId,
                            category: 'tummy',
                            durationMinutes: evt.durationMinutes,
                            timestamp: evt.startTime,
                            notes: `Tummy time auto-stopped & logged (reached ${evt.durationMinutes}m safety cutoff)`,
                            skipAudioAnnouncement: true
                        });
                    }

                    setRateLimitWarning(`⏱️ Safety Cutoff Reached: ${evt.label} timer auto-stopped and logged after reaching maximum limit (${evt.durationMinutes} min).`);

                    if (curSettings.reminderChimes) {
                        try {
                            SoundEngine.playChime('reminder');
                        } catch (e) {}
                    }
                });
            }
        };

        const interval = setInterval(updateAllRunningTimers, 1000);

        // Immediate wall-clock catch-up on visibilitychange (lock screen / background tab switch)
        const onVisibilityOrFocusChange = () => {
            updateAllRunningTimers();
        };

        document.addEventListener('visibilitychange', onVisibilityOrFocusChange);
        window.addEventListener('focus', onVisibilityOrFocusChange);
        window.addEventListener('pageshow', onVisibilityOrFocusChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibilityOrFocusChange);
            window.removeEventListener('focus', onVisibilityOrFocusChange);
            window.removeEventListener('pageshow', onVisibilityOrFocusChange);
        };
    }, []);

    const fallbackChild: ChildProfile = {
        id: 'child_placeholder',
        name: 'Your Baby',
        birthDate: '',
        avatarEmoji: '👶',
        gender: 'other'
    };

    const activeChild = childrenList.find(c => c.id === activeChildId) || childrenList[0] || fallbackChild;

    // Ensure active child has timers initialized
    const activeTimers = childTimersMap[activeChild.id] || initialTimers;

    const setUnit = (newUnit: MeasurementUnit) => setUnitState(newUnit);

    const setActiveChildId = (id: string) => {
        setActiveChildIdState(id);
        localStorage.setItem('bt_app_active_child_id', id);
    };

    const addLog = (logData: Omit<ActivityLog, 'id' | 'timestamp' | 'dateStr'> & { dateStr?: string; timestamp?: number; childId?: string; skipAudioAnnouncement?: boolean }): ActivityLog | null => {
        const targetChildId = logData.childId || activeChild.id;
        const timestamp = logData.timestamp || Date.now();
        const dateObj = new Date(timestamp);
        const localYear = dateObj.getFullYear();
        const localMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
        const localDay = String(dateObj.getDate()).padStart(2, '0');
        const localDateStr = `${localYear}-${localMonth}-${localDay}`;
        // If explicit dateStr or explicit timestamp is provided (e.g. overnight timer started at 11:50pm), anchor to start date!
        const dateStr = logData.dateStr || (logData.timestamp ? localDateStr : (selectedDate || localDateStr));

        // De-duplication guard: Never duplicate identical timer or quick logs within 2.5 seconds
        const isDuplicate = logs.some(l =>
            (l.childId === targetChildId || (!l.childId && targetChildId === 'child_1')) &&
            l.category === logData.category &&
            Math.abs((l.timestamp || 0) - timestamp) < 2500 &&
            l.durationMinutes === logData.durationMinutes &&
            l.amountMl === logData.amountMl
        );
        if (isDuplicate) {
            return null;
        }

        // Clinical safety rate limits per child per day to prevent spam clicking / bad actors
        const childTodayLogs = logs.filter(l => (l.childId === targetChildId || (!l.childId && targetChildId === 'child_1')) && l.dateStr === dateStr);

        const categoryLimits: Record<string, { max: number; label: string }> = {
            diaper: { max: 25, label: 'diaper changes' },
            feeding: { max: 20, label: 'feedings' },
            pumping: { max: 15, label: 'pumping sessions' },
            sleep: { max: 15, label: 'sleep logs' },
            tummy: { max: 20, label: 'tummy time sessions' },
            health: { max: 20, label: 'health entries' },
            solids: { max: 15, label: 'solids entries' },
            milestone: { max: 15, label: 'milestones' },
            bath: { max: 5, label: 'baths' }
        };

        const limitInfo = categoryLimits[logData.category];
        if (limitInfo) {
            const currentCatCount = childTodayLogs.filter(l => l.category === logData.category).length;
            if (currentCatCount >= limitInfo.max) {
                const warnMsg = `⚠️ Daily Clinical Safety Limit: A baby cannot safely have over ${limitInfo.max} ${limitInfo.label} in one day. Action paused to protect records.`;
                setRateLimitWarning(warnMsg);
                return null;
            }
        }

        if (childTodayLogs.length >= 60) {
            const warnMsg = `⚠️ Daily Safety Limit: Maximum 60 daily logs reached for ${activeChild.name}. Further quick logging paused.`;
            setRateLimitWarning(warnMsg);
            return null;
        }

        const hours = dateObj.getHours();
        const mins = String(dateObj.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHr = hours % 12 || 12;
        const timeStr = `${displayHr}:${mins} ${ampm}`;

        const sanitizedNotes = logData.notes ? sanitizeInput(logData.notes).slice(0, 1000) : undefined;

        const newLog: ActivityLog = {
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            childId: targetChildId,
            timeStr,
            updatedAt: Date.now(),
            ...logData,
            notes: sanitizedNotes,
            foodName: logData.foodName ? sanitizeInput(logData.foodName).slice(0, 100) : undefined,
            medicationName: logData.medicationName ? sanitizeInput(logData.medicationName).slice(0, 100) : undefined,
            dosage: logData.dosage ? sanitizeInput(logData.dosage).slice(0, 100) : undefined,
            timestamp,
            dateStr
        } as ActivityLog;

        setLogs(prev => [newLog, ...prev]);

        // If audio talkback is enabled for on-screen logging, announce it audibly
        if (VoiceAssistant.isSpeakerActive() && !logData.skipAudioAnnouncement) {
            VoiceAssistant.announceLog(newLog);
        }

        return newLog;
    };

    addLogRef.current = addLog;

    const updateLog = (log: ActivityLog) => {
        const sanitized: ActivityLog = {
            ...log,
            notes: log.notes ? sanitizeInput(log.notes).slice(0, 1000) : undefined,
            foodName: log.foodName ? sanitizeInput(log.foodName).slice(0, 100) : undefined,
            medicationName: log.medicationName ? sanitizeInput(log.medicationName).slice(0, 100) : undefined,
            dosage: log.dosage ? sanitizeInput(log.dosage).slice(0, 100) : undefined,
            updatedAt: Date.now()
        };
        setLogs(prev => prev.map(l => (l.id === sanitized.id ? sanitized : l)));
    };

    const deleteLog = (id: string) => {
        setLogs(prev => prev.filter(l => l.id !== id));
    };

    const saveChild = (child: ChildProfile): { success: boolean; error?: string } => {
        const exists = childrenList.some(c => c.id === child.id);
        if (!exists && childrenList.length >= 6) {
            return { success: false, error: 'Pro tier limit reached. You can add up to 6 children.' };
        }
        const sanitizedChild: ChildProfile = {
            ...child,
            name: sanitizeInput(child.name).slice(0, 50) || 'Baby',
            pediatrician: child.pediatrician ? sanitizeInput(child.pediatrician).slice(0, 80) : undefined,
            clinic: child.clinic ? sanitizeInput(child.clinic).slice(0, 100) : undefined,
            allergies: child.allergies ? sanitizeInput(child.allergies).slice(0, 200) : undefined
        };
        setChildrenList(prev => {
            const next = exists ? prev.map(c => (c.id === sanitizedChild.id ? sanitizedChild : c)) : [...prev, sanitizedChild];
            return next;
        });
        return { success: true };
    };

    const deleteChild = (id: string): { success: boolean; error?: string } => {
        const remaining = childrenList.filter(c => c.id !== id);
        setChildrenList(remaining);

        // Delete logs for removed child
        setLogs(prev => prev.filter(l => l.childId !== id));

        // Delete timers
        setChildTimersMap(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });

        // If removed child was active, switch active to first remaining
        if (activeChildId === id) {
            const nextActive = remaining[0]?.id || '';
            setActiveChildIdState(nextActive);
            localStorage.setItem('bt_app_active_child_id', nextActive);
        }

        return { success: true };
    };

    const saveCaregiver = (cg: Caregiver) => {
        setCaregivers(prev => {
            const next = prev.map(c => (c.id === cg.id ? cg : c));
            return next;
        });
    };

    const addCaregiver = (cg: Omit<Caregiver, 'id'>): { success: boolean; error?: string } => {
        if (caregivers.length >= 4) {
            return { success: false, error: 'Maximum of 4 caregivers allowed.' };
        }
        const newCg: Caregiver = {
            id: `cg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            ...cg
        };
        setCaregivers(prev => [...prev, newCg]);
        return { success: true };
    };

    const deleteCaregiver = (id: string): { success: boolean; error?: string } => {
        setCaregivers(prev => prev.filter(c => c.id !== id));
        return { success: true };
    };

    const startTimer = (key: keyof TimersState) => {
        const now = Date.now();
        setChildTimersMap(prev => {
            const current = prev[activeChild.id] || { ...initialTimers };
            const session = current[key];
            if (session.isRunning) return prev;
            const currentElapsed = session.elapsedSeconds || 0;

            // For feed timer, the Discard Milk safety timer starts on first bottle touch (1-hr static window).
            // It remains completely independent and does not pause when the feed pauses.
            let discardStart = session.discardMilkStartTime;
            if (key === 'feed') {
                if (!discardStart || (now - discardStart >= 3600 * 1000)) {
                    discardStart = now;
                }
            }

            return {
                ...prev,
                [activeChild.id]: {
                    ...current,
                    [key]: {
                        ...session,
                        isRunning: true,
                        startTime: session.startTime || now,
                        discardMilkStartTime: key === 'feed' ? discardStart : session.discardMilkStartTime,
                        baseSeconds: currentElapsed,
                        runningSince: now,
                        elapsedSeconds: currentElapsed
                    }
                }
            };
        });
    };

    const pauseTimer = (key: keyof TimersState) => {
        const now = Date.now();
        setChildTimersMap(prev => {
            const current = prev[activeChild.id] || { ...initialTimers };
            const session = current[key];
            if (!session.isRunning) return prev;
            const addedSeconds = session.runningSince ? Math.max(0, Math.floor((now - session.runningSince) / 1000)) : 0;
            const newTotalElapsed = (session.baseSeconds !== undefined ? session.baseSeconds : session.elapsedSeconds) + addedSeconds;
            return {
                ...prev,
                [activeChild.id]: {
                    ...current,
                    [key]: {
                        ...session,
                        isRunning: false,
                        baseSeconds: newTotalElapsed,
                        runningSince: null,
                        elapsedSeconds: newTotalElapsed
                        // discardMilkStartTime is preserved and continues countdown independently
                    }
                }
            };
        });
    };

    const resetTimer = (key: keyof TimersState) => {
        setChildTimersMap(prev => {
            const current = prev[activeChild.id] || { ...initialTimers };
            return {
                ...prev,
                [activeChild.id]: {
                    ...current,
                    [key]: {
                        isRunning: false,
                        startTime: null,
                        baseSeconds: 0,
                        runningSince: null,
                        elapsedSeconds: 0,
                        // Resetting or saving the feed timer automatically resets the Discard Milk timer (session stopped/bottle finished)
                        discardMilkStartTime: key === 'feed' ? null : undefined
                    }
                }
            };
        });
    };

    const resetDiscardMilkTimer = () => {
        setChildTimersMap(prev => {
            const current = prev[activeChild.id] || { ...initialTimers };
            return {
                ...prev,
                [activeChild.id]: {
                    ...current,
                    feed: {
                        ...current.feed,
                        discardMilkStartTime: null
                    }
                }
            };
        });
    };

    const startDiscardMilkTimer = () => {
        const now = Date.now();
        setChildTimersMap(prev => {
            const current = prev[activeChild.id] || { ...initialTimers };
            return {
                ...prev,
                [activeChild.id]: {
                    ...current,
                    feed: {
                        ...current.feed,
                        discardMilkStartTime: now
                    }
                }
            };
        });
    };

    const saveTimer = (key: keyof TimersState) => {
        const currentTimers = childTimersMap[activeChild.id] || initialTimers;
        const timerData = currentTimers[key];
        const elapsedSecs = timerData?.elapsedSeconds || 0;
        const elapsedMinutes = Math.max(1, Math.round(elapsedSecs / 60));

        if (key === 'feed') {
            addLog({
                category: 'feeding',
                durationMinutes: elapsedMinutes,
                subType: 'formula',
                amountMl: settings.defaultFeedVolume || 60,
                notes: `Feed session (${elapsedMinutes} mins)`,
                skipAudioAnnouncement: true
            });
        } else if (key === 'pump') {
            addLog({
                category: 'pumping',
                durationMinutes: elapsedMinutes,
                amountMl: settings.defaultPumpAmount || 100,
                notes: `Pumping session (${elapsedMinutes} mins)`,
                skipAudioAnnouncement: true
            });
        } else if (key === 'sleep') {
            addLog({
                category: 'sleep',
                durationMinutes: elapsedMinutes,
                isNightSleep: false,
                notes: `Nap sleep (${elapsedMinutes} mins)`,
                skipAudioAnnouncement: true
            });
        } else if (key === 'tummy') {
            addLog({
                category: 'tummy',
                durationMinutes: elapsedMinutes,
                notes: `Tummy time (${elapsedMinutes} mins)`,
                skipAudioAnnouncement: true
            });
        }
        resetTimer(key);
    };

    const handOffShift = (nextCaregiverId: string, notes?: string) => {
        const prevCg = caregivers.find(c => c.id === caregiverShift.activeCaregiverId) || { name: 'Caregiver' };
        const nextCg = caregivers.find(c => c.id === nextCaregiverId) || { name: 'Care Partner' };
        const elapsedMs = Math.max(0, Date.now() - caregiverShift.shiftStartTime);
        const durHours = Math.floor(elapsedMs / (3600 * 1000));
        const durMins = Math.floor((elapsedMs % (3600 * 1000)) / 60000);
        const durStr = durHours > 0 ? `${durHours}h ${durMins}m` : `${durMins}m`;

        const updated: CaregiverShiftState = {
            ...caregiverShift,
            activeCaregiverId: nextCaregiverId,
            shiftStartTime: Date.now(),
            lastHandoverTime: Date.now(),
            lastHandoverNotes: notes || undefined
        };

        setCaregiverShift(updated);
        try {
            localStorage.setItem('bt_app_caregiver_shift', JSON.stringify(updated));
        } catch (e) {}

        // Add milestone log to activity feed
        addLog({
            category: 'milestone',
            milestoneTitle: `Shift Hand-off: ${prevCg.name} ➔ ${nextCg.name}`,
            notes: `Shift duration: ${durStr}${notes ? ` • Hand-off note: ${notes}` : ''}`,
            skipAudioAnnouncement: true
        });

        // Broadcast to partners
        syncService.broadcastState({
            caregiverShift: updated,
            logs,
            activeChildId,
            appointments,
            children: childrenList,
            caregivers
        });
    };

    const addShiftProtocol = (text: string, category: ShiftProtocol['category'] = 'general') => {
        if (!text.trim()) return;
        const newProtocol: ShiftProtocol = {
            id: 'proto_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
            text: text.trim(),
            category,
            createdAt: Date.now()
        };
        const updated: CaregiverShiftState = {
            ...caregiverShift,
            pinnedProtocols: [newProtocol, ...caregiverShift.pinnedProtocols]
        };
        setCaregiverShift(updated);
        try {
            localStorage.setItem('bt_app_caregiver_shift', JSON.stringify(updated));
        } catch (e) {}
        syncService.broadcastState({ caregiverShift: updated });
    };

    const removeShiftProtocol = (id: string) => {
        const updated: CaregiverShiftState = {
            ...caregiverShift,
            pinnedProtocols: caregiverShift.pinnedProtocols.filter(p => p.id !== id)
        };
        setCaregiverShift(updated);
        try {
            localStorage.setItem('bt_app_caregiver_shift', JSON.stringify(updated));
        } catch (e) {}
        syncService.broadcastState({ caregiverShift: updated });
    };

    // Filter logs strictly to active child for context consumers
    const activeChildLogs = logs.filter(l => !l.childId || l.childId === activeChild.id);

    // Calculate streak days strictly for the active child
    const uniqueDays = new Set(activeChildLogs.map(l => l.dateStr)).size;
    const streakDays = Math.max(uniqueDays, 1);

    // Initialize Voice Assistant bindings
    useEffect(() => {
        VoiceAssistant.init(
            {
                onLogFeed: (subType, amountMl) => {
                    addLog({ category: 'feeding', subType, amountMl, skipAudioAnnouncement: true });
                },
                onLogDiaper: (subType) => {
                    addLog({ category: 'diaper', subType, skipAudioAnnouncement: true });
                },
                onLogQuick: (type, amountOrMinutes) => {
                    if (type === 'vitamins') {
                        addLog({ category: 'feeding', subType: 'vitamins', amountMl: amountOrMinutes || 20, skipAudioAnnouncement: true });
                    } else if (type === 'tummy') {
                        addLog({ category: 'tummy', durationMinutes: amountOrMinutes || 5, skipAudioAnnouncement: true });
                    } else if (type === 'pump') {
                        addLog({ category: 'pumping', amountMl: amountOrMinutes || 100, skipAudioAnnouncement: true });
                    } else if (type === 'sleep') {
                        addLog({ category: 'sleep', durationMinutes: amountOrMinutes || 60, isNightSleep: false, skipAudioAnnouncement: true });
                    }
                },
                onStartTimer: (timer) => startTimer(timer),
                onPauseTimer: (timer) => pauseTimer(timer),
                onSaveTimer: (timer) => saveTimer(timer),
                onResetTimer: (timer) => resetTimer(timer),
                onUndoLastActivity: () => {
                    if (activeChildLogs.length > 0) {
                        deleteLog(activeChildLogs[0].id);
                        return true;
                    }
                    return false;
                },
                onConfirmationRequested: (_question) => {},
                onStatusQuery: (_reply) => {},
                onError: (err) => console.warn('Voice error:', err)
            },
            () => activeChildLogs,
            () => activeChild,
            () => settings
        );

        if (VoiceAssistant.isMicActive() && VoiceAssistant.isSupported() && !VoiceAssistant.getListeningState()) {
            VoiceAssistant.start();
        }
    }, [activeChildLogs, activeChild, settings]);

    return (
        <AppContext.Provider
            value={{
                authSession,
                isAuthenticated,
                setAuthSession,
                login,
                signup,
                logout,
                changePassword,
                deleteAccount,
                activeChild,
                children: childrenList,
                logs: activeChildLogs,
                allLogs: logs,
                unit,
                activeTab,
                timers: activeTimers,
                caregivers,
                appointments,
                caregiverShift,
                selectedDate,
                isCalendarVisible,
                roomId,
                streakDays,
                settings,
                rateLimitWarning,
                clearRateLimitWarning,
                updateSettings,
                setActiveTab,
                setUnit,
                setSelectedDate,
                setIsCalendarVisible,
                setRoomId,
                addLog,
                updateLog,
                deleteLog,
                addAppointment,
                updateAppointment,
                deleteAppointment,
                setActiveChildId,
                saveChild,
                deleteChild,
                saveCaregiver,
                addCaregiver,
                deleteCaregiver,
                startTimer,
                pauseTimer,
                resetTimer,
                saveTimer,
                resetDiscardMilkTimer,
                startDiscardMilkTimer,
                handOffShift,
                addShiftProtocol,
                removeShiftProtocol
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
};

export default AppContext;

