import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { ActiveTab } from '../../types/state';
import { Clock, LineChart, Users, Mic, Music } from 'lucide-react';
import { VoiceAssistant } from '../../engines/voiceEngine';

interface NavigationTabsProps {
    onOpenVoice?: () => void;
    onOpenSoundMachine?: () => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ onOpenVoice }) => {
    const { activeTab, setActiveTab, settings, updateSettings } = useApp();
    const [isMicOn, setIsMicOn] = useState<boolean>(() => VoiceAssistant.isMicActive());

    useEffect(() => {
        const unsub = VoiceAssistant.onStateChange(st => {
            setIsMicOn(st.isMic);
        });
        return () => unsub();
    }, []);

    const handleJumpToSoundMachine = () => {
        if (activeTab !== 'tracker') {
            setActiveTab('tracker');
        }
        if (settings.hiddenSections && settings.hiddenSections.includes('sound-machine')) {
            updateSettings({
                hiddenSections: settings.hiddenSections.filter(s => s !== 'sound-machine')
            });
        }
        setTimeout(() => {
            const el = document.getElementById('block-sound-machine') || document.getElementById('soundMachineCard');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                el.classList.add('sound-machine-highlight');
                setTimeout(() => el.classList.remove('sound-machine-highlight'), 1800);
            }
        }, 50);
    };

    const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
        { id: 'tracker', label: 'Tracker', icon: <Clock size={16} /> },
        { id: 'metrics', label: 'Tools & Metrics', icon: <LineChart size={16} /> },
        { id: 'profile', label: 'Profile', icon: <Users size={16} /> }
    ];

    return (
        <div className="desktop-only-nav-tabs" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '8px'
        }}>
            <nav aria-label="Main application tabs" style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none'
            }}>
                {tabs.map(t => {
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            id={`nav-tab-${t.id}`}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 18px',
                                borderRadius: '12px',
                                border: 'none',
                                background: isActive ? 'var(--primary-accent)' : 'transparent',
                                color: isActive ? 'var(--primary-accent-contrast, #ffffff)' : 'var(--text-secondary)',
                                fontWeight: 700,
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {t.icon}
                            <span>{t.label}</span>
                            {t.badge && (
                                <span style={{
                                    padding: '2px 7px',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    background: isActive ? 'rgba(0,0,0,0.15)' : 'var(--bg-surface-elevated)',
                                    color: isActive ? 'var(--primary-accent-contrast, #ffffff)' : 'var(--text-muted)'
                                }}>
                                    {t.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Top-Right Voice Assistant & Sound Machine Jump Button */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginLeft: 'auto'
            }}>
                {onOpenVoice && (
                    <button
                        type="button"
                        id="btn-voice-assistant-toggle"
                        onClick={onOpenVoice}
                        className={isMicOn ? 'btn-voice-glowing' : 'btn-ghost'}
                        style={isMicOn ? {
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '6px 13px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                        } : {
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '6px 12px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            backgroundColor: 'rgba(244, 63, 94, 0.08)',
                            color: '#f43f5e',
                            border: '1px solid rgba(244, 63, 94, 0.25)'
                        }}
                        title={isMicOn ? 'Voice Assistant (Listening) - Click to Open Settings' : 'Voice Assistant (Muted) - Click to Open Settings'}
                        aria-label="Nightstand Voice Assistant"
                    >
                        <Mic size={14} style={{ color: isMicOn ? '#f43f5e' : 'var(--text-muted)' }} />
                        <span>Voice Assistant</span>
                        {isMicOn && (
                            <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#f43f5e',
                                boxShadow: '0 0 6px #f43f5e'
                            }} />
                        )}
                    </button>
                )}

                <button
                    type="button"
                    id="btn-jump-sound-machine"
                    onClick={handleJumpToSoundMachine}
                    className="btn-ghost"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        color: 'var(--primary-accent)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                    title="Jump to Sound Machine"
                    aria-label="Jump to Nursery Sound Machine section"
                >
                    <Music size={15} />
                </button>
            </div>
        </div>
    );
};

