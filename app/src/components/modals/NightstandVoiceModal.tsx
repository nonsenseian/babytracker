import React, { useState, useEffect, useRef } from 'react';
import { VoiceAssistant } from '../../engines/voiceEngine';
import { Mic, MicOff, Volume2, VolumeX, X, ChevronDown, ChevronUp } from 'lucide-react';
import { SoundEngine } from '../../engines/soundMachine';

interface NightstandVoiceModalProps {
    onClose: () => void;
}

export const NightstandVoiceModal: React.FC<NightstandVoiceModalProps> = ({ onClose }) => {
    const [micEnabled, setMicEnabled] = useState<boolean>(VoiceAssistant.isMicActive());
    const [speakerEnabled, setSpeakerEnabled] = useState<boolean>(VoiceAssistant.isSpeakerActive());
    const [isListening, setIsListening] = useState<boolean>(VoiceAssistant.getListeningState());
    const [transcript, setTranscript] = useState<string>(() =>
        VoiceAssistant.isMicActive()
            ? 'Listening for "Hey Nova" or your baby\'s name...'
            : 'Microphone is muted. Voice commands are disabled.'
    );
    const [wakeSupported, setWakeSupported] = useState<boolean>(true);
    const [showAllCommands, setShowAllCommands] = useState<boolean>(false);
    const [confirmationQuestion, setConfirmationQuestion] = useState<string | null>(() => {
        const pending = VoiceAssistant.getPendingConfirmation();
        return pending ? 'Would you like me to undo the last activity?' : null;
    });
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showAllCommands && listRef.current) {
            listRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [showAllCommands]);

    useEffect(() => {
        setWakeSupported(VoiceAssistant.isSupported());

        if (VoiceAssistant.isMicActive() && VoiceAssistant.isSupported()) {
            VoiceAssistant.start().then(ok => {
                setIsListening(ok);
                if (!ok) {
                    setMicEnabled(false);
                }
            });
        }

        const unsubState = VoiceAssistant.onStateChange((state) => {
            setMicEnabled(state.isMic);
            setSpeakerEnabled(state.isSpeaker);
        });

        const unsubSpeech = VoiceAssistant.onSpeech((text) => {
            setTranscript(text);
        });

        const unsubConfirm = VoiceAssistant.onConfirmationChange((question) => {
            setConfirmationQuestion(question);
        });

        return () => {
            unsubState();
            unsubSpeech();
            unsubConfirm();
        };
    }, []);

    const toggleMic = async () => {
        const next = !micEnabled;
        if (next) {
            const ok = await VoiceAssistant.setMicEnabled(true);
            setMicEnabled(ok);
            setIsListening(ok);
            if (ok) {
                setTranscript('Listening for "Hey Nova"...');
                SoundEngine.playChime('wake');
            }
        } else {
            await VoiceAssistant.setMicEnabled(false);
            setMicEnabled(false);
            setIsListening(false);
            setTranscript('Microphone is muted. Voice commands are disabled.');
        }
    };

    const toggleSpeaker = () => {
        const next = !speakerEnabled;
        setSpeakerEnabled(next);
        VoiceAssistant.setSpeakerEnabled(next);
        if (next) {
            SoundEngine.playChime('success');
            VoiceAssistant.speak('Audio feedback enabled.');
        }
    };

    const handleSimulateCommand = (cmd: string) => {
        setTranscript(`Simulated: "${cmd}"`);
        VoiceAssistant.simulateCommand(cmd);
    };

    const testFemaleVoice = () => {
        SoundEngine.playChime('wake');
        VoiceAssistant.speak('Hello! I am your baby care voice assistant. I can log feedings, diapers, and answer status queries.');
    };

    const getModeInfo = () => {
        if (micEnabled && speakerEnabled) {
            return {
                title: 'Two-Way Voice Assistant',
                desc: 'Listening for voice commands & speaking confirmations aloud',
                badgeColor: '#10b981',
                badgeBg: 'rgba(16, 185, 129, 0.15)',
                tag: 'MIC & AUDIO ON'
            };
        } else if (micEnabled && !speakerEnabled) {
            return {
                title: 'Silent Voice Assistant',
                desc: 'Processes voice commands silently without spoken talkback',
                badgeColor: '#8b5cf6',
                badgeBg: 'rgba(139, 92, 246, 0.15)',
                tag: 'SILENT VOICE INPUT'
            };
        } else if (!micEnabled && speakerEnabled) {
            return {
                title: 'Audio Announcer Only',
                desc: 'Mic disabled. On-screen logs will audibly announce completed actions',
                badgeColor: '#0ea5e9',
                badgeBg: 'rgba(14, 165, 233, 0.15)',
                tag: 'AUDIO TALKBACK ONLY'
            };
        } else {
            return {
                title: 'Fully Muted Mode',
                desc: 'Both voice input and audio talkback are currently turned off',
                badgeColor: '#64748b',
                badgeBg: 'rgba(100, 116, 139, 0.15)',
                tag: 'FULLY MUTED'
            };
        }
    };

    const mode = getModeInfo();

    return (
        <div
            className="modal-backdrop"
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '16px',
                backdropFilter: 'blur(4px)'
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="nightstand-voice-title"
        >
            <div
                className="surface-card"
                style={{
                    width: '100%',
                    maxWidth: '540px',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            backgroundColor: micEnabled ? '#f43f5e' : 'var(--badge-bg)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: micEnabled ? '0 0 15px rgba(244, 63, 94, 0.4)' : 'none',
                            transition: 'all 0.2s ease'
                        }}>
                            <Mic size={22} className={isListening && micEnabled ? 'spark-pulse' : ''} />
                        </div>
                        <div>
                            <h2 id="nightstand-voice-title" style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                                🎙️ Nightstand Voice Assistant
                            </h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                Hands-free bedside voice recognition with independent audio talkback
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-ghost"
                        style={{ padding: '6px' }}
                        aria-label="Close voice assistant modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Active Mode Status Banner */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: mode.badgeBg,
                    border: `1px solid ${mode.badgeColor}40`,
                    marginBottom: '18px'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 900, color: mode.badgeColor, letterSpacing: '0.04em' }}>
                                {mode.tag}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                • {mode.title}
                            </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {mode.desc}
                        </div>
                    </div>
                </div>

                {/* Independent Mic & Speaker Controls (Dual Buttons) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '20px'
                }}>
                    {/* Microphone Toggle Button */}
                    <button
                        id="btn-voice-mic-toggle"
                        onClick={toggleMic}
                        aria-pressed={micEnabled}
                        aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
                        style={{
                            padding: '16px 12px',
                            borderRadius: '14px',
                            border: `2px solid ${micEnabled ? '#f43f5e' : 'var(--border-color)'}`,
                            backgroundColor: micEnabled ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-surface-elevated)',
                            color: micEnabled ? '#f43f5e' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            boxShadow: micEnabled ? '0 0 16px rgba(244, 63, 94, 0.2)' : 'none'
                        }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: micEnabled ? '#f43f5e' : 'var(--border-color)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {micEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: micEnabled ? '#f43f5e' : 'var(--text-primary)' }}>
                                {micEnabled ? 'Microphone ON' : 'Microphone OFF'}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {micEnabled ? (isListening ? 'Listening for speech' : 'Mic Active') : 'Tap to enable mic'}
                            </div>
                        </div>
                    </button>

                    {/* Speaker Talkback Toggle Button */}
                    <button
                        id="btn-voice-speaker-toggle"
                        onClick={toggleSpeaker}
                        aria-pressed={speakerEnabled}
                        aria-label={speakerEnabled ? 'Mute audio messages' : 'Enable audio messages'}
                        style={{
                            padding: '16px 12px',
                            borderRadius: '14px',
                            border: `2px solid ${speakerEnabled ? '#0ea5e9' : 'var(--border-color)'}`,
                            backgroundColor: speakerEnabled ? 'rgba(14, 165, 233, 0.12)' : 'var(--bg-surface-elevated)',
                            color: speakerEnabled ? '#0ea5e9' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            boxShadow: speakerEnabled ? '0 0 16px rgba(14, 165, 233, 0.2)' : 'none'
                        }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: speakerEnabled ? '#0ea5e9' : 'var(--border-color)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {speakerEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: speakerEnabled ? '#0ea5e9' : 'var(--text-primary)' }}>
                                {speakerEnabled ? 'Audio Messages ON' : 'Audio Messages OFF'}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {speakerEnabled ? 'Speaks confirmations' : 'Silent completed tasks'}
                            </div>
                        </div>
                    </button>
                </div>

                {/* Live Transcript / Hearing Card */}
                <div style={{
                    padding: '14px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            {micEnabled ? '🎙️ Live Voice Input' : '🔇 Voice Input (Muted)'}
                        </div>
                        {micEnabled && isListening && (
                            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                                READY
                            </span>
                        )}
                    </div>
                    <div style={{
                        fontSize: '13px',
                        color: micEnabled ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontStyle: 'italic',
                        lineHeight: 1.4
                    }}>
                        "{transcript}"
                    </div>
                    {transcript.includes('Safari') && (
                        <div style={{
                            marginTop: '10px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                            border: '1.5px solid rgba(239, 68, 68, 0.4)',
                            fontSize: '11.5px',
                            color: 'var(--text-primary)',
                            lineHeight: 1.45
                        }}>
                            <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: '4px' }}>
                                🔒 Safari Microphone Permission Blocked
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                1. In Safari's URL address bar, tap the <strong>aA</strong> (or lock/settings) icon.<br />
                                2. Tap <strong>Website Settings</strong>.<br />
                                3. Set <strong>Microphone</strong> to <strong>Allow</strong>.<br />
                                4. Refresh this page and tap <strong>Microphone ON</strong> above.
                            </div>
                        </div>
                    )}
                    {!wakeSupported && (
                        <div style={{
                            marginTop: '10px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            border: '1.5px solid rgba(245, 158, 11, 0.35)',
                            fontSize: '11.5px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.45
                        }}>
                            <div style={{ fontWeight: 800, color: '#f59e0b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>⚠️ Live Microphone Status ({typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) ? 'iOS Device' : 'Web Browser'})</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) ? (
                                    <>
                                        • <strong>Chrome on iOS</strong>: Apple limits live microphone APIs in all third-party iOS browsers (WKWebView engine).<br />
                                        • <strong>Safari on iOS</strong>: Requires HTTPS (or installed native app) for live microphone permissions.<br />
                                        👉 <em>Tap "Log Dirty Diaper" below to test voice logging and audio talkback on your iPhone!</em>
                                    </>
                                ) : (
                                    <>
                                        Live microphone listening requires HTTPS or a Web Speech API enabled browser. Tap the button below to test voice actions and spoken talkback!
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {confirmationQuestion && (
                        <div
                            id="voice-confirmation-card"
                            style={{
                                marginTop: '12px',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(234, 179, 8, 0.14)',
                                border: '1.5px solid #eab308',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}
                        >
                            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>❓</span>
                                <span>{confirmationQuestion}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                <button
                                    id="btn-voice-confirm-yes"
                                    onClick={() => handleSimulateCommand('yes')}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        backgroundColor: '#10b981',
                                        color: '#fff',
                                        border: 'none',
                                        fontWeight: 800,
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Yes, Undo
                                </button>
                                <button
                                    id="btn-voice-confirm-no"
                                    onClick={() => handleSimulateCommand('no')}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                        color: '#ef4444',
                                        border: '1px solid #ef4444',
                                        fontWeight: 800,
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    No, Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Spoken Voice Output Box */}
                <div style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    {speakerEnabled ? (
                        <Volume2 size={20} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                    ) : (
                        <VolumeX size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                Voice Output
                            </div>
                            <button
                                onClick={testFemaleVoice}
                                id="voice-test-output-btn"
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-surface)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                            >
                                Test Voice
                            </button>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Voice Assistant can perform hands-free actions
                        </div>
                    </div>
                </div>

                {/* Instant Quick-Test Section */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '8px'
                    }}>
                        Try Speaking or Tap Below:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        <button
                            onClick={() => handleSimulateCommand('summary')}
                            id="voice-test-summary-btn"
                            style={{
                                padding: '10px 12px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-surface-elevated)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span>📊</span>
                            <span>"Hey Nova, summary"</span>
                        </button>

                        <button
                            onClick={() => handleSimulateCommand('undo last activity')}
                            id="voice-test-undo-btn"
                            style={{
                                padding: '10px 12px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-surface-elevated)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span>↩️</span>
                            <span>"Hey Nova, undo"</span>
                        </button>

                        <button
                            onClick={() => handleSimulateCommand('start feed timer')}
                            id="voice-test-feed-timer-btn"
                            style={{
                                padding: '10px 12px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-surface-elevated)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span>🍼</span>
                            <span>"Start feed timer"</span>
                        </button>

                        <button
                            onClick={() => handleSimulateCommand('dirty diaper')}
                            id="voice-test-dirty-diaper-btn"
                            style={{
                                padding: '10px 12px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-surface-elevated)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span>💩</span>
                            <span>"Dirty diaper"</span>
                        </button>
                    </div>
                </div>

                {/* See All Voice Commands Expandable Section */}
                <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                    <button
                        onClick={() => setShowAllCommands(prev => !prev)}
                        id="see-all-voice-commands-btn"
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '1px dashed var(--border-color)',
                            backgroundColor: 'transparent',
                            color: 'var(--primary-accent)',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        <span>{showAllCommands ? 'Hide voice commands' : 'See all voice commands'}</span>
                        {showAllCommands ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showAllCommands && (
                        <div
                            ref={listRef}
                            id="all-voice-commands-list"
                            style={{
                                marginTop: '10px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                backgroundColor: 'var(--bg-surface-elevated)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                maxHeight: '185px',
                                overflowY: 'auto'
                            }}
                        >
                            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                Commands (Start with "Hey Nova" or "Nova"):
                            </div>
                            {[
                                { icon: '📊', text: 'Summary: "Hey Nova, give me a summary"' },
                                { icon: '↩️', text: 'Undo: "Hey Nova, undo last activity" (confirm with Yes/No)' },
                                { icon: '🍼', text: 'Feed Timer: "Start", "Resume", "Pause", "Stop", "Save", "Reset"' },
                                { icon: '🥛', text: 'Pump Timer: "Start", "Resume", "Pause", "Stop", "Save", "Reset"' },
                                { icon: '😴', text: 'Nap Timer: "Start", "Resume", "Pause", "Stop", "Save", "Reset"' },
                                { icon: '🤸', text: 'Tummy Timer: "Start", "Resume", "Pause", "Stop", "Save", "Reset"' },
                                { icon: '💩', text: 'Diaper: "Dirty diaper", "Pee", "Poop", "Both"' },
                                { icon: '🍼', text: 'Feeding: "Formula 60 ml", "Breastmilk 4 oz", "Nursing"' },
                                { icon: '😴', text: 'Sleep: "Baby fell asleep", "Baby woke up", "Nap 60 min"' },
                                { icon: '🤸', text: 'Activity: "Tummy time 5 min", "Daily vitamins"' },
                                { icon: '🕒', text: 'Status: "When was last feed?", "When was last diaper?"' }
                            ].map((cmd, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '12px',
                                        color: 'var(--text-primary)',
                                        padding: '2px 0',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    <span style={{ fontSize: '14px', flexShrink: 0 }}>{cmd.icon}</span>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cmd.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Done Button */}
                <div style={{ marginTop: '20px' }}>
                    <button
                        onClick={onClose}
                        className="btn-primary"
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 800 }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
