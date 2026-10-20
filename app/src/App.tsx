import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { CondensedFloatingHeader } from './components/layout/CondensedFloatingHeader';
import { NavigationTabs } from './components/layout/NavigationTabs';
import { QuickLoggingPad } from './components/tracker/QuickLoggingPad';
import { LiveTimersBar } from './components/tracker/LiveTimersBar';
import { NurserySoundMachineCard } from './components/tracker/NurserySoundMachineCard';
import { ActivityLogList } from './components/tracker/ActivityLogList';
import { TimelineRibbon } from './components/tracker/TimelineRibbon';
import { MilestoneTrophyCase } from './components/analytics/MilestoneTrophyCase';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { FamilyProfileView } from './components/profile/FamilyProfileView';
import { SweetNapCard } from './components/tracker/SweetNapCard';
import { CaregiverHandoffCard } from './components/tracker/CaregiverHandoffCard';
import { DoctorDossierModal } from './components/modals/DoctorDossierModal';
import { LogActivityModal } from './components/modals/LogActivityModal';
import { ChildProfileModal } from './components/modals/ChildProfileModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { NightstandVoiceModal } from './components/modals/NightstandVoiceModal';
import { AppointmentModal } from './components/modals/AppointmentModal';
import { CouplesSyncModal } from './components/modals/CouplesSyncModal';
import { AuthModal } from './components/modals/AuthModal';
import type { ActivityCategory, ActivityLog } from './types/log';
import type { TimersState } from './types/state';
import type { BabyAppointment } from './types/appointment';
import { CustomizableTabSections } from './components/common/CustomizableTabSections';

const MainLayout: React.FC = () => {
    const {
        activeTab,
        addLog,
        settings,
        updateSettings,
        activeChild,
        selectedDate,
        startTimer,
        pauseTimer,
        resetTimer,
        timers,
        isAuthenticated,
        setAuthSession
    } = useApp();

    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('feeding');
    const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);

    const [isChildModalOpen, setIsChildModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [isDoctorDossierOpen, setIsDoctorDossierOpen] = useState(false);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(() => {
        try {
            return new URLSearchParams(window.location.search).get('modal') === 'appointment';
        } catch(e) {
            return false;
        }
    });
    const [appointmentToEdit, setAppointmentToEdit] = useState<BabyAppointment | null>(null);
    const [isCouplesSyncOpen, setIsCouplesSyncOpen] = useState(() => {
        try {
            return new URLSearchParams(window.location.search).get('modal') === 'sync';
        } catch(e) {
            return false;
        }
    });

    const [initialSubType, setInitialSubType] = useState<string | undefined>(undefined);

    const handleSelectCategory = (cat: ActivityCategory, subType?: string) => {
        setSelectedCategory(cat);
        setInitialSubType(subType);
        setEditingLog(null);
        setIsLogModalOpen(true);
    };

    const handleEditLog = (log: ActivityLog) => {
        setSelectedCategory(log.category);
        setInitialSubType(log.subType);
        setEditingLog(log);
        setIsLogModalOpen(true);
    };

    const handleLogTimer = (type: keyof TimersState, elapsedMinutes: number, meta?: any) => {
        if (type === 'sleep') {
            addLog({ category: 'sleep', durationMinutes: elapsedMinutes, isNightSleep: false });
        } else if (type === 'tummy') {
            addLog({ category: 'tummy', durationMinutes: elapsedMinutes });
        } else if (type === 'pump') {
            addLog({ category: 'pumping', durationMinutes: elapsedMinutes, amountMl: settings.defaultPumpAmount || 100 });
        } else if (type === 'feed') {
            const isNursing = meta?.subType === 'nursing';
            addLog({
                category: 'feeding',
                durationMinutes: elapsedMinutes,
                subType: meta?.subType || 'formula',
                amountMl: isNursing ? 0 : (settings.defaultFeedVolume || 60),
                notes: meta?.notes || (isNursing ? `Nursing session (${elapsedMinutes} mins)` : undefined)
            });
        }
    };

    const handleEditTimer = (type: keyof TimersState, elapsedMinutes: number, meta?: any) => {
        const cat = type === 'sleep' ? 'sleep' : type === 'tummy' ? 'tummy' : type === 'pump' ? 'pumping' : 'feeding';
        setSelectedCategory(cat);
        const isNursing = meta?.subType === 'nursing';
        const d = new Date();
        const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setEditingLog({
            id: '',
            childId: activeChild.id,
            category: cat,
            subType: meta?.subType || (cat === 'feeding' ? 'formula' : undefined),
            durationMinutes: elapsedMinutes,
            amountMl: cat === 'pumping' ? (settings.defaultPumpAmount || 100) : (cat === 'feeding' && !isNursing ? (settings.defaultFeedVolume || 60) : undefined),
            notes: meta?.notes,
            timestamp: Date.now(),
            timeStr: d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            dateStr: selectedDate || localDateStr
        } as any);
        setIsLogModalOpen(true);
    };

    // Tracker sections catalog
    const trackerSectionComponents: Record<string, { label: string; element: React.ReactNode }> = {
        'sweet-nap': {
            label: '💤 Nap Predictor',
            element: (
                <SweetNapCard
                    onStartNapTimer={() => startTimer('sleep')}
                    onPauseNapTimer={() => pauseTimer('sleep')}
                    onStopNapTimer={() => {
                        const elapsedMinutes = Math.max(1, Math.round(timers.sleep.elapsedSeconds / 60));
                        pauseTimer('sleep');
                        handleLogTimer('sleep', elapsedMinutes);
                        resetTimer('sleep');
                    }}
                    onLogNapModal={() => handleEditTimer('sleep', 45)}
                />
            )
        },
        'timeline-ribbon': {
            label: '⏱️ 24-Hour Day Ribbon',
            element: <TimelineRibbon />
        },
        'quick-logging': {
            label: '⚡ Quick Log',
            element: (
                <QuickLoggingPad
                    onOpenCustomEntry={(cat, subType) => handleSelectCategory(cat || 'feeding', subType)}
                    onEditLog={handleEditLog}
                />
            )
        },
        'timers': {
            label: '⏱️ Live Timers',
            element: <LiveTimersBar onLogTimer={handleLogTimer} onEditTimer={handleEditTimer} />
        },
        'sound-machine': {
            label: '🎶 Sound Machine',
            element: <NurserySoundMachineCard />
        },
        'activity-log': {
            label: '📜 Activity History',
            element: (
                <ActivityLogList
                    onEdit={handleEditLog}
                    onAddNew={() => handleSelectCategory('feeding')}
                />
            )
        }
    };

    const defaultTrackerSections = [
        'timers',
        'quick-logging',
        'timeline-ribbon',
        'activity-log',
        'sound-machine',
        'sweet-nap'
    ];

    // Family Profile sections catalog
    const profileSectionComponents: Record<string, { label: string; element: React.ReactNode }> = {
        'family-profiles': {
            label: '👨‍👩‍👦 Child Profiles',
            element: (
                <FamilyProfileView
                    onOpenChildModal={() => setIsChildModalOpen(true)}
                    onOpenCouplesSync={() => setIsCouplesSyncOpen(true)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                />
            )
        },
        'caregiver-handoff': {
            label: '🤝 Caregiver Shift',
            element: <CaregiverHandoffCard />
        },
        'milestones': {
            label: '🏆 Milestones & Trophies',
            element: <MilestoneTrophyCase />
        }
    };

    const defaultProfileSections = [
        'family-profiles',
        'caregiver-handoff',
        'milestones'
    ];

    const isAnyModalOpen =
        !isAuthenticated ||
        isChildModalOpen ||
        isSettingsOpen ||
        isVoiceModalOpen ||
        isDoctorDossierOpen ||
        isAppointmentModalOpen ||
        isCouplesSyncOpen ||
        isLogModalOpen;

    return (
        <div className={`app-container ${settings.isLayoutEditMode ? 'layout-edit-mode' : ''}`}>
            <CondensedFloatingHeader
                onOpenChildModal={() => setIsChildModalOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenVoice={() => setIsVoiceModalOpen(true)}
                isModalOpen={isAnyModalOpen}
            />

            <Header
                onOpenChildModal={() => setIsChildModalOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenVoice={() => setIsVoiceModalOpen(true)}
                onOpenCouplesSync={() => setIsCouplesSyncOpen(true)}
                onOpenDoctorDossier={() => setIsDoctorDossierOpen(true)}
            />

            <NavigationTabs
                onOpenVoice={() => setIsVoiceModalOpen(true)}
            />

            {activeTab === 'tracker' && (
                <main>
                    <CustomizableTabSections
                        tabId="tracker"
                        sectionOrder={settings.sectionOrder || defaultTrackerSections}
                        defaultOrder={defaultTrackerSections}
                        hiddenSections={settings.hiddenSections || []}
                        sectionComponents={trackerSectionComponents}
                        onUpdateOrder={(newOrder) => updateSettings({ sectionOrder: newOrder })}
                        onHideSection={(id) => updateSettings({ hiddenSections: [...(settings.hiddenSections || []), id] })}
                        onRestoreSection={(id) => updateSettings({ hiddenSections: (settings.hiddenSections || []).filter(s => s !== id) })}
                        onResetLayout={() => updateSettings({ sectionOrder: defaultTrackerSections, hiddenSections: [] })}
                    />
                </main>
            )}

            {activeTab === 'metrics' && (
                <main>
                    <AnalyticsDashboard
                        onOpenAddAppointment={() => {
                            setAppointmentToEdit(null);
                            setIsAppointmentModalOpen(true);
                        }}
                        onOpenEditAppointment={(apt) => {
                            setAppointmentToEdit(apt);
                            setIsAppointmentModalOpen(true);
                        }}
                        onOpenDoctorDossier={() => setIsDoctorDossierOpen(true)}
                        onEditLog={handleEditLog}
                    />
                </main>
            )}

            {activeTab === 'profile' && (
                <main>
                    <CustomizableTabSections
                        tabId="profile"
                        sectionOrder={settings.profileSectionOrder || defaultProfileSections}
                        defaultOrder={defaultProfileSections}
                        hiddenSections={settings.hiddenProfileSections || []}
                        sectionComponents={profileSectionComponents}
                        onUpdateOrder={(newOrder) => updateSettings({ profileSectionOrder: newOrder })}
                        onHideSection={(id) => updateSettings({ hiddenProfileSections: [...(settings.hiddenProfileSections || []), id] })}
                        onRestoreSection={(id) => updateSettings({ hiddenProfileSections: (settings.hiddenProfileSections || []).filter(s => s !== id) })}
                        onResetLayout={() => updateSettings({ profileSectionOrder: defaultProfileSections, hiddenProfileSections: [] })}
                    />
                </main>
            )}

            {/* Modals */}
            {isLogModalOpen && (
                <LogActivityModal
                    initialCategory={selectedCategory}
                    initialSubType={initialSubType}
                    editingLog={editingLog}
                    onClose={() => setIsLogModalOpen(false)}
                />
            )}


            {isChildModalOpen && (
                <ChildProfileModal onClose={() => setIsChildModalOpen(false)} />
            )}

            {isSettingsOpen && (
                <SettingsModal onClose={() => setIsSettingsOpen(false)} />
            )}

            {isVoiceModalOpen && (
                <NightstandVoiceModal onClose={() => setIsVoiceModalOpen(false)} />
            )}

            {isAppointmentModalOpen && (
                <AppointmentModal
                    appointmentToEdit={appointmentToEdit}
                    onClose={() => {
                        setIsAppointmentModalOpen(false);
                        setAppointmentToEdit(null);
                    }}
                />
            )}

            {isCouplesSyncOpen && (
                <CouplesSyncModal onClose={() => setIsCouplesSyncOpen(false)} />
            )}

            {isDoctorDossierOpen && (
                <DoctorDossierModal
                    isOpen={isDoctorDossierOpen}
                    onClose={() => setIsDoctorDossierOpen(false)}
                />
            )}

            {/* Mandatory Sign-Up / Authentication Gate (First launch & session expiry) */}
            <AuthModal
                isOpen={!isAuthenticated}
                onAuthenticated={(session) => {
                    setAuthSession(session);
                }}
            />
        </div>
    );
};

export const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AppProvider>
                <MainLayout />
            </AppProvider>
        </ThemeProvider>
    );
};

export default App;
