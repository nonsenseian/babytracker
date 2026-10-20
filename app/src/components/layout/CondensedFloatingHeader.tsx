import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Home, LineChart, Users, Mic, Settings as SettingsIcon, ArrowUp } from 'lucide-react';
import { VoiceAssistant } from '../../engines/voiceEngine';

interface CondensedFloatingHeaderProps {
    onOpenChildModal?: () => void;
    onOpenSettings?: () => void;
    onOpenVoice?: () => void;
    isModalOpen?: boolean;
}

export const CondensedFloatingHeader: React.FC<CondensedFloatingHeaderProps> = ({
    onOpenSettings,
    onOpenVoice,
    isModalOpen = false
}) => {
    const { activeTab, setActiveTab } = useApp();
    const [isScrolledDown, setIsScrolledDown] = useState(false);
    const [isMicActive, setIsMicActive] = useState(VoiceAssistant.isMicActive());

    useEffect(() => {
        const unsub = VoiceAssistant.onStateChange(st => {
            setIsMicActive(st.isMic);
        });
        return () => unsub();
    }, []);

    // Scroll listener: shrinks menu by ~15% (scale 0.85) and sets 50% opacity when scrolling down.
    // When scrolling stops or user scrolls up slightly, smoothly returns to 100% opacity and normal scale.
    useEffect(() => {
        let lastY = window.scrollY;
        let ticking = false;
        let scrollStopTimer: any = null;

        const handleScroll = () => {
            if (scrollStopTimer) {
                clearTimeout(scrollStopTimer);
            }

            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentY = window.scrollY;
                    if (currentY > 60 && currentY > lastY) {
                        setIsScrolledDown(true); // scrolling down -> small mode + 50% opacity
                    } else if (currentY <= 20 || currentY < lastY - 4) {
                        setIsScrolledDown(false); // scrolling up or near top -> 100% opaque + normal scale
                    }
                    lastY = currentY;
                    ticking = false;
                });
                ticking = true;
            }

            // Detect when scrolling stops
            scrollStopTimer = setTimeout(() => {
                setIsScrolledDown(false);
            }, 250);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollStopTimer) clearTimeout(scrollStopTimer);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTrackerClick = () => {
        if (activeTab === 'tracker') {
            scrollToTop();
        } else {
            setActiveTab('tracker');
        }
    };

    if (isModalOpen) return null;

    const isTrackerActive = activeTab === 'tracker';
    const isMetricsActive = activeTab === 'metrics';
    const isProfileActive = activeTab === 'profile';

    return (
        <aside
            id="condensed-floating-header"
            aria-label="Persistent Bottom Navigation Menu"
            style={{
                position: 'fixed',
                bottom: 'max(14px, env(safe-area-inset-bottom))',
                left: '50%',
                transform: isScrolledDown
                    ? 'translate(-50%, 0) scale(0.85)'
                    : 'translate(-50%, 0) scale(1)',
                transformOrigin: 'center bottom',
                opacity: isScrolledDown ? 0.5 : 1,
                transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
                zIndex: 95,
                width: 'calc(100% - 24px)',
                maxWidth: '520px',
                borderRadius: '9999px',
                backgroundColor: 'var(--bg-surface-elevated, #1e293b)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid var(--border-color)',
                boxShadow: isScrolledDown
                    ? '0 8px 24px rgba(0, 0, 0, 0.3)'
                    : '0 14px 36px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.1)',
                padding: '6px 8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                alignItems: 'center',
                color: 'var(--text-primary)',
                userSelect: 'none'
            }}
        >
            {/* Slot 1: Nightstand Voice Assistant */}
            <button
                type="button"
                id="btn-bottom-voice"
                onClick={onOpenVoice}
                className="bottom-nav-action-btn"
                title="Nightstand Voice Assistant"
                aria-label="Nightstand Voice Assistant"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    minHeight: '48px',
                    width: '100%',
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: isMicActive ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    color: isMicActive ? '#ef4444' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                }}
            >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mic size={22} strokeWidth={isMicActive ? 2.5 : 2} />
                    {isMicActive && (
                        <span style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            boxShadow: '0 0 6px #ef4444'
                        }} />
                    )}
                </div>
                <span className="bottom-tab-label" style={{ fontSize: '10px', fontWeight: isMicActive ? 800 : 600 }}>
                    Voice
                </span>
            </button>

            {/* Slot 2: Tools & Metrics */}
            <button
                type="button"
                id="bottom-nav-tab-metrics"
                onClick={() => setActiveTab('metrics')}
                className="bottom-nav-action-btn"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    minHeight: '48px',
                    width: '100%',
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: isMetricsActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                    color: isMetricsActive ? 'var(--primary-accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                }}
                aria-label="Tools and Metrics"
                aria-current={isMetricsActive ? 'page' : undefined}
            >
                <LineChart size={22} strokeWidth={isMetricsActive ? 2.5 : 2} />
                <span className="bottom-tab-label" style={{ fontSize: '10px', fontWeight: isMetricsActive ? 800 : 600 }}>
                    Metrics
                </span>
            </button>

            {/* Slot 3: DEAD CENTER HERO - Tracker (Home Icon) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <button
                    type="button"
                    id="bottom-nav-tab-tracker"
                    onClick={handleTrackerClick}
                    className="bottom-nav-center-hero-btn"
                    title={isTrackerActive ? 'Home Tracker (Tap to scroll to top)' : 'Home Tracker'}
                    aria-label="Home Tracker"
                    aria-current={isTrackerActive ? 'page' : undefined}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        border: isTrackerActive ? '2px solid rgba(255, 255, 255, 0.35)' : '1px solid var(--border-color)',
                        backgroundColor: isTrackerActive ? 'var(--primary-accent)' : 'var(--bg-surface)',
                        color: isTrackerActive ? 'var(--primary-accent-contrast, #ffffff)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        transform: 'translateY(-6px)',
                        boxShadow: isTrackerActive
                            ? '0 6px 18px rgba(245, 158, 11, 0.45), 0 2px 6px rgba(0,0,0,0.2)'
                            : '0 4px 12px rgba(0, 0, 0, 0.25)',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                >
                    <Home size={25} strokeWidth={isTrackerActive ? 2.5 : 2.1} />
                </button>
            </div>

            {/* Slot 4: Family Profile */}
            <button
                type="button"
                id="bottom-nav-tab-profile"
                onClick={() => setActiveTab('profile')}
                className="bottom-nav-action-btn"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    minHeight: '48px',
                    width: '100%',
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: isProfileActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                    color: isProfileActive ? 'var(--primary-accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                }}
                aria-label="Family Profile and Care Team"
                aria-current={isProfileActive ? 'page' : undefined}
            >
                <Users size={22} strokeWidth={isProfileActive ? 2.5 : 2} />
                <span className="bottom-tab-label" style={{ fontSize: '10px', fontWeight: isProfileActive ? 800 : 600 }}>
                    Profile
                </span>
            </button>

            {/* Slot 5: Settings Menu */}
            <button
                type="button"
                id="btn-bottom-settings"
                onClick={onOpenSettings}
                className="bottom-nav-action-btn"
                title="Settings & Layout Customization"
                aria-label="Settings and Layout Customization"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    minHeight: '48px',
                    width: '100%',
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                }}
            >
                <SettingsIcon size={22} strokeWidth={2} />
                <span className="bottom-tab-label" style={{ fontSize: '10px', fontWeight: 600 }}>
                    Settings
                </span>
            </button>

            {/* Floating Action Button: Scroll To Top (Right above the dock) */}
            <button
                type="button"
                id="btn-bottom-scroll-top"
                onClick={scrollToTop}
                title="Scroll to Top"
                aria-label="Scroll to Top"
                style={{
                    position: 'absolute',
                    right: '6px',
                    bottom: 'calc(100% + 8px)',
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface-elevated, #1e293b)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: isScrolledDown ? 'scale(1)' : 'scale(0.88)',
                    opacity: isScrolledDown ? 1 : 0.75
                }}
            >
                <ArrowUp size={16} strokeWidth={2.5} />
            </button>
        </aside>
    );
};
