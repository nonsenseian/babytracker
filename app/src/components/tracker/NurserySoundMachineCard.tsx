import React, { useState, useEffect, useRef } from 'react';
import { SoundEngine, AudioRecorder, SOUND_TRACKS, type SoundType } from '../../engines/soundMachine';

export const NurserySoundMachineCard: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeType, setActiveType] = useState<SoundType>('rain');
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState<number>(80);
    const [sleepMinutes, setSleepMinutes] = useState<number>(0); // 0 = Continuous ∞
    const [sleepRemaining, setSleepRemaining] = useState<number | null>(null);

    // Custom voice recording state
    const [showStudio, setShowStudio] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordSeconds, setRecordSeconds] = useState(0);
    const [hasSavedAudio, setHasSavedAudio] = useState(false);
    const [savedBlob, setSavedBlob] = useState<Blob | null>(null);
    const [savedTimestamp, setSavedTimestamp] = useState<string>('');
    const [isPlayingCustom, setIsPlayingCustom] = useState(false);
    const [customLoop, setCustomLoop] = useState(true);
    const [customVolume, setCustomVolume] = useState(80);
    const [isInfiniteLoop, setIsInfiniteLoop] = useState<boolean>(true);
    const [customMins, setCustomMins] = useState<number>(45);

    const sleepTimerRef = useRef<any>(null);
    const recordTimerRef = useRef<any>(null);

    // Load saved recording on mount
    useEffect(() => {
        AudioRecorder.loadRecording().then(res => {
            if (res) {
                setHasSavedAudio(true);
                setSavedBlob(res.blob);
                const d = new Date(res.createdAt);
                setSavedTimestamp(d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
        });
    }, []);

    // Sleep timer countdown with true Wall-Clock accuracy (persists across device lock)
    useEffect(() => {
        if (sleepMinutes <= 0 || !isPlaying) {
            setSleepRemaining(null);
            if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
            return;
        }

        const targetEndTime = Date.now() + sleepMinutes * 60 * 1000;

        const updateSleepCountdown = () => {
            const now = Date.now();
            const remainingSecs = Math.max(0, Math.round((targetEndTime - now) / 1000));
            if (remainingSecs <= 0) {
                if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
                setSleepRemaining(null);
                SoundEngine.stop();
                setIsPlaying(false);
            } else {
                setSleepRemaining(remainingSecs);
            }
        };

        updateSleepCountdown();
        sleepTimerRef.current = setInterval(updateSleepCountdown, 1000);
        document.addEventListener('visibilitychange', updateSleepCountdown);
        window.addEventListener('focus', updateSleepCountdown);
        window.addEventListener('pageshow', updateSleepCountdown);

        return () => {
            if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
            document.removeEventListener('visibilitychange', updateSleepCountdown);
            window.removeEventListener('focus', updateSleepCountdown);
            window.removeEventListener('pageshow', updateSleepCountdown);
        };
    }, [sleepMinutes, isPlaying]);

    // Handle Built-in Track Selection
    const handleSelectTrack = (type: SoundType) => {
        setActiveType(type);
        if (isPlayingCustom) {
            AudioRecorder.stopPlayback();
            setIsPlayingCustom(false);
        }
        SoundEngine.play(type, volume / 100, sleepMinutes);
        setIsPlaying(true);
    };

    // Toggle Play/Pause Built-in Soundscape
    const handleTogglePlay = () => {
        if (isPlaying) {
            SoundEngine.stop();
            setIsPlaying(false);
        } else {
            if (isPlayingCustom) {
                AudioRecorder.stopPlayback();
                setIsPlayingCustom(false);
            }
            SoundEngine.play(activeType, volume / 100, sleepMinutes);
            setIsPlaying(true);
        }
    };

    // Volume Change
    const handleVolumeChange = (newVol: number) => {
        setVolume(newVol);
        SoundEngine.setVolume(newVol / 100);
    };

    // Custom Recording Handlers
    const handleStartRecording = async () => {
        if (isPlaying) {
            SoundEngine.stop();
            setIsPlaying(false);
        }
        if (isPlayingCustom) {
            AudioRecorder.stopPlayback();
            setIsPlayingCustom(false);
        }
        try {
            await AudioRecorder.startRecording();
            setIsRecording(true);
            setRecordSeconds(0);

            if (recordTimerRef.current) clearInterval(recordTimerRef.current);
            recordTimerRef.current = setInterval(() => {
                setRecordSeconds(prev => {
                    if (prev >= 119) {
                        handleStopRecording();
                        return 120;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (e) {
            alert('Microphone access was denied or not available.');
        }
    };

    const handleStopRecording = async () => {
        if (recordTimerRef.current) {
            clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
        }
        try {
            const blob = await AudioRecorder.stopRecording();
            setIsRecording(false);
            setHasSavedAudio(true);
            setSavedBlob(blob);
            const now = new Date();
            setSavedTimestamp(now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch (e) {
            setIsRecording(false);
        }
    };

    const handleToggleCustomPlay = () => {
        if (!savedBlob) return;
        if (isPlaying) {
            SoundEngine.stop();
            setIsPlaying(false);
        }

        if (isPlayingCustom) {
            AudioRecorder.stopPlayback();
            setIsPlayingCustom(false);
        } else {
            AudioRecorder.setLoop(customLoop);
            AudioRecorder.setVolume(customVolume / 100);
            AudioRecorder.playBlob(savedBlob, () => {
                setIsPlayingCustom(false);
            });
            setIsPlayingCustom(true);
        }
    };

    const handleToggleCustomLoop = () => {
        const next = !customLoop;
        setCustomLoop(next);
        AudioRecorder.setLoop(next);
    };

    const handleCustomVolumeChange = (v: number) => {
        setCustomVolume(v);
        AudioRecorder.setVolume(v / 100);
    };

    const handleDeleteCustom = async () => {
        if (window.confirm('Delete this recorded lullaby?')) {
            await AudioRecorder.deleteRecording();
            setHasSavedAudio(false);
            setSavedBlob(null);
            setIsPlayingCustom(false);
            setSavedTimestamp('');
        }
    };

    const activeTrack = SOUND_TRACKS[activeType] || SOUND_TRACKS.rain;

    const formatTimer = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div id="block-sound-machine" data-layout-id="block-sound-machine" className="layout-card-block relative mb-4">
            <section
                id="soundMachineCard"
                className="surface-card rounded-2xl p-4 sm:p-5 shadow-sm cute-card"
                style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    transition: 'all 0.2s ease'
                }}
            >
                {/* Header Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>🎵</span>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                                    Sound Machine
                                </h3>
                                <span
                                    id="soundModePill"
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        padding: '2px 8px',
                                        borderRadius: '9999px',
                                        background: isInfiniteLoop || sleepMinutes === 0
                                            ? 'rgba(99, 102, 241, 0.15)'
                                            : 'rgba(245, 158, 11, 0.2)',
                                        color: isInfiniteLoop || sleepMinutes === 0 ? '#6366f1' : '#f59e0b',
                                        border: isInfiniteLoop || sleepMinutes === 0
                                            ? '1px solid rgba(99, 102, 241, 0.3)'
                                            : '1px solid rgba(245, 158, 11, 0.4)'
                                    }}
                                >
                                    {isInfiniteLoop || sleepMinutes === 0
                                        ? 'Continuous'
                                        : (sleepRemaining !== null ? `⏳ ${formatTimer(sleepRemaining)}` : `⏳ ${sleepMinutes}m`)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        id="toggleSoundMachineCollapseBtn"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="btn-ghost"
                        style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        {isCollapsed ? 'Show Player 🔽' : 'Hide Player 🔼'}
                    </button>
                </div>

                {!isCollapsed && (
                    <div id="soundMachineContent" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Presets Row */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            overflowX: 'auto',
                            maxWidth: '100%',
                            paddingBottom: '4px',
                            WebkitOverflowScrolling: 'touch',
                            scrollbarWidth: 'thin'
                        }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', flexShrink: 0 }}>Presets:</span>

                            <button
                                type="button"
                                id="preset-btn-white"
                                onClick={() => handleSelectTrack('white')}
                                style={{
                                    padding: '7px 12px',
                                    borderRadius: '10px',
                                    border: activeType === 'white' && isPlaying ? '2px solid #8b5cf6' : '1px solid var(--border-color)',
                                    background: activeType === 'white' && isPlaying ? 'rgba(139, 92, 246, 0.15)' : 'var(--surface-sunken)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <span>📻</span>
                                <span>White Noise</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectTrack('rain')}
                                style={{
                                    padding: '7px 12px',
                                    borderRadius: '10px',
                                    border: activeType === 'rain' && isPlaying ? '2px solid #0284c7' : '1px solid var(--border-color)',
                                    background: activeType === 'rain' && isPlaying ? 'rgba(2, 132, 199, 0.15)' : 'var(--surface-sunken)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <span>🌧️</span>
                                <span>Gentle Rain</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectTrack('waves')}
                                style={{
                                    padding: '7px 12px',
                                    borderRadius: '10px',
                                    border: activeType === 'waves' && isPlaying ? '2px solid #0d9488' : '1px solid var(--border-color)',
                                    background: activeType === 'waves' && isPlaying ? 'rgba(13, 148, 136, 0.15)' : 'var(--surface-sunken)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <span>🌊</span>
                                <span>Ocean Waves</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectTrack('chimes')}
                                style={{
                                    padding: '7px 12px',
                                    borderRadius: '10px',
                                    border: activeType === 'chimes' && isPlaying ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                                    background: activeType === 'chimes' && isPlaying ? 'rgba(245, 158, 11, 0.15)' : 'var(--surface-sunken)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <span>🎹</span>
                                <span>Piano Lullaby</span>
                            </button>

                            {/* Record your own audio button with microphone */}
                            <button
                                type="button"
                                id="recordOwnAudioBtn"
                                onClick={() => setShowStudio(!showStudio)}
                                style={{
                                    padding: '7px 14px',
                                    borderRadius: '10px',
                                    border: showStudio ? '2px solid #ec4899' : '1px solid rgba(236, 72, 153, 0.4)',
                                    background: showStudio ? 'rgba(236, 72, 153, 0.18)' : 'rgba(236, 72, 153, 0.08)',
                                    color: '#ec4899',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                }}
                                title="Record your own soothing audio (2 minute limit)"
                            >
                                <span>🎙️</span>
                                <span>Record your own audio</span>
                            </button>
                        </div>

                        {/* Custom Voice & Audio Studio Panel (Expandable) */}
                        {showStudio && (
                            <div
                                id="customAudioStudioCard"
                                style={{
                                    padding: '14px',
                                    borderRadius: '14px',
                                    background: 'var(--surface-sunken)',
                                    border: '1px dashed #ec4899',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '20px' }}>🎙️</span>
                                        <div>
                                            <h4 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, color: '#ec4899' }}>
                                                Custom Voice & Audio Studio
                                            </h4>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                                2-minute max hard cap • Stored locally in browser IndexedDB
                                            </span>
                                        </div>
                                    </div>

                                    {isRecording && (
                                        <span
                                            id="recordingBadge"
                                            style={{
                                                fontSize: '10px',
                                                padding: '2px 8px',
                                                borderRadius: '9999px',
                                                fontWeight: 900,
                                                background: '#ef444420',
                                                color: '#ef4444',
                                                border: '1px solid #ef4444',
                                                animation: 'pulse 1s infinite'
                                            }}
                                        >
                                            🔴 Recording
                                        </span>
                                    )}
                                </div>

                                {/* Recording Controls */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            type="button"
                                            id="startRecordAudioBtn"
                                            onClick={handleStartRecording}
                                            disabled={isRecording}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: isRecording ? '#94a3b8' : 'linear-gradient(135deg, #ec4899, #f43f5e)',
                                                color: '#fff',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                cursor: isRecording ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <span>🔴</span>
                                            <span>{hasSavedAudio ? 'Re-Record Voice Memo' : 'Start Recording'}</span>
                                        </button>

                                        <button
                                            type="button"
                                            id="stopRecordAudioBtn"
                                            onClick={handleStopRecording}
                                            disabled={!isRecording}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: isRecording ? '#ef4444' : 'var(--surface-elevated)',
                                                color: isRecording ? '#fff' : 'var(--text-muted)',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                cursor: isRecording ? 'pointer' : 'not-allowed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <span>⏹️</span>
                                            <span>Stop & Save</span>
                                        </button>

                                        <div
                                            id="recordTimerDisplay"
                                            style={{
                                                marginLeft: 'auto',
                                                fontFamily: 'monospace',
                                                fontSize: '12px',
                                                fontWeight: 800,
                                                padding: '6px 10px',
                                                borderRadius: '8px',
                                                background: 'var(--surface-elevated)',
                                                border: '1px solid var(--border-color)',
                                                color: isRecording ? '#ef4444' : 'var(--text-primary)'
                                            }}
                                        >
                                            {formatTimer(recordSeconds)} / 02:00
                                        </div>
                                    </div>

                                    {/* Progress Bar (0 to 120s) */}
                                    <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                                        <div
                                            id="recordProgressBar"
                                            style={{
                                                width: `${(recordSeconds / 120) * 100}%`,
                                                height: '100%',
                                                background: '#ec4899',
                                                transition: 'width 0.3s ease'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Saved Playback Controls */}
                                {hasSavedAudio && (
                                    <div
                                        id="savedAudioControlsSection"
                                        style={{
                                            padding: '12px',
                                            borderRadius: '12px',
                                            background: 'var(--surface-elevated)',
                                            border: '1px solid var(--border-color)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <button
                                                    type="button"
                                                    id="playCustomAudioBtn"
                                                    onClick={handleToggleCustomPlay}
                                                    style={{
                                                        padding: '7px 14px',
                                                        borderRadius: '10px',
                                                        border: 'none',
                                                        background: isPlayingCustom ? '#10b981' : '#ec4899',
                                                        color: '#fff',
                                                        fontSize: '11px',
                                                        fontWeight: 800,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <span>{isPlayingCustom ? '⏸️' : '▶️'}</span>
                                                    <span>{isPlayingCustom ? 'Pause Audio' : 'Play Audio'}</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    id="loopCustomAudioBtn"
                                                    onClick={handleToggleCustomLoop}
                                                    style={{
                                                        padding: '7px 12px',
                                                        borderRadius: '10px',
                                                        border: customLoop ? '1px solid #ec4899' : '1px solid var(--border-color)',
                                                        background: customLoop ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
                                                        color: customLoop ? '#ec4899' : 'var(--text-muted)',
                                                        fontSize: '11px',
                                                        fontWeight: 800,
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Toggle Infinite Loop Playback"
                                                >
                                                    <span>{customLoop ? '🔁 Infinite Loop: ON' : '➡️ Play Once'}</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    id="deleteCustomAudioBtn"
                                                    onClick={handleDeleteCustom}
                                                    style={{
                                                        padding: '7px 12px',
                                                        borderRadius: '10px',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        background: 'transparent',
                                                        color: '#ef4444',
                                                        fontSize: '11px',
                                                        fontWeight: 800,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                    title="Delete recorded audio"
                                                >
                                                    <span>🗑️</span>
                                                    <span>Delete</span>
                                                </button>
                                            </div>

                                            <span id="customAudioTimestampLabel" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                {savedTimestamp ? `Saved ${savedTimestamp}` : 'Saved Recording'}
                                            </span>
                                        </div>

                                        {/* Volume Slider for Custom Audio */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            paddingTop: '6px',
                                            borderTop: '1px solid var(--border-color)',
                                            width: '100%',
                                            maxWidth: '100%',
                                            boxSizing: 'border-box',
                                            minWidth: 0
                                        }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>🔊 Volume:</span>
                                            <input
                                                type="range"
                                                id="customAudioVolumeSlider"
                                                min="0"
                                                max="100"
                                                value={customVolume}
                                                onChange={(e) => handleCustomVolumeChange(parseInt(e.target.value, 10))}
                                                style={{ flex: 1, minWidth: '40px', width: '100%', accentColor: '#ec4899', height: '6px', cursor: 'pointer' }}
                                            />
                                            <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 800, width: '36px', textAlign: 'right', flexShrink: 0 }}>
                                                {customVolume}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Built-in Nursery Soundscape Suite Player Card */}
                        <div
                            id="nativeSoundscapeCard"
                            style={{
                                padding: '16px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                                color: '#fff',
                                border: '1px solid rgba(99, 102, 241, 0.4)',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px',
                                maxWidth: '100%',
                                boxSizing: 'border-box',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%', minWidth: 0, maxWidth: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                    <span id="soundActiveIcon" style={{ fontSize: '28px', flexShrink: 0 }}>{activeTrack.icon}</span>
                                    <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
                                            <h4 id="soundActiveTitle" style={{
                                                fontSize: '14px',
                                                fontWeight: 900,
                                                letterSpacing: '0.02em',
                                                margin: 0,
                                                color: '#fff',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                maxWidth: '100%'
                                            }}>
                                                {activeTrack.name}
                                            </h4>
                                            {isPlaying && (
                                                <span
                                                    id="soundPlayingBadge"
                                                    style={{
                                                        fontSize: '9px',
                                                        fontWeight: 900,
                                                        padding: '2px 8px',
                                                        borderRadius: '9999px',
                                                        background: 'rgba(16, 185, 129, 0.25)',
                                                        color: '#10b981',
                                                        border: '1px solid rgba(16, 185, 129, 0.4)',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    Playing
                                                </span>
                                            )}
                                        </div>
                                        <p id="soundActiveSubtitle" style={{
                                            fontSize: '11px',
                                            color: '#c7d2fe',
                                            margin: '2px 0 0 0',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '100%'
                                        }}>
                                            {activeTrack.subtitle}
                                        </p>
                                    </div>
                                </div>

                                {/* Animated Waveform Equalizer */}
                                <div
                                    id="soundEqualizer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        gap: '3px',
                                        height: '24px',
                                        padding: '0 4px',
                                        opacity: isPlaying ? 1 : 0.3,
                                        flexShrink: 0
                                    }}
                                    title="Acoustic Activity"
                                >
                                    <div style={{ width: '4px', height: isPlaying ? '14px' : '4px', background: '#fbbf24', borderRadius: '4px', transition: 'height 0.2s ease' }} />
                                    <div style={{ width: '4px', height: isPlaying ? '22px' : '6px', background: '#818cf8', borderRadius: '4px', transition: 'height 0.25s ease' }} />
                                    <div style={{ width: '4px', height: isPlaying ? '18px' : '4px', background: '#fbbf24', borderRadius: '4px', transition: 'height 0.18s ease' }} />
                                    <div style={{ width: '4px', height: isPlaying ? '10px' : '5px', background: '#818cf8', borderRadius: '4px', transition: 'height 0.3s ease' }} />
                                </div>
                            </div>

                            {/* Controls Bar */}
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                paddingTop: '10px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                width: '100%',
                                maxWidth: '100%',
                                boxSizing: 'border-box'
                            }}>
                                <button
                                    type="button"
                                    id="soundPlayToggleBtn"
                                    onClick={handleTogglePlay}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: '#f59e0b',
                                        color: '#0f172a',
                                        fontSize: '12px',
                                        fontWeight: 900,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                >
                                    <span id="soundPlayIcon">{isPlaying ? '⏸️' : '▶️'}</span>
                                    <span id="soundPlayText">{isPlaying ? 'Pause Sound' : 'Play Sound'}</span>
                                </button>

                                {/* Volume Slider */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    flex: '1 1 140px',
                                    minWidth: 0,
                                    maxWidth: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    <span style={{ fontSize: '12px', color: '#c7d2fe', flexShrink: 0 }}>🔊</span>
                                    <input
                                        type="range"
                                        id="soundVolumeSlider"
                                        min="0"
                                        max="100"
                                        value={volume}
                                        onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                                        style={{
                                            flex: 1,
                                            minWidth: '40px',
                                            width: '100%',
                                            accentColor: '#f59e0b',
                                            height: '6px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <span id="soundVolumeLabel" style={{
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        fontWeight: 800,
                                        color: '#c7d2fe',
                                        width: '36px',
                                        textAlign: 'right',
                                        flexShrink: 0
                                    }}>
                                        {volume}%
                                    </span>
                                </div>

                                {/* Sleep Timer & Infinite Loop Controls */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    flexShrink: 0,
                                    maxWidth: '100%',
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(99, 102, 241, 0.5)',
                                    borderRadius: '10px',
                                    padding: '4px 10px'
                                }}>
                                    <label
                                        id="soundInfiniteLoopLabel"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            color: '#c7d2fe',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            id="soundInfiniteLoopCheckbox"
                                            checked={isInfiniteLoop}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setIsInfiniteLoop(checked);
                                                if (checked) {
                                                    setSleepMinutes(0);
                                                    if (isPlaying) SoundEngine.play(activeType, volume / 100, 0);
                                                } else {
                                                    const m = customMins || 45;
                                                    setSleepMinutes(m);
                                                    if (isPlaying) SoundEngine.play(activeType, volume / 100, m);
                                                }
                                            }}
                                            style={{ accentColor: '#6366f1', cursor: 'pointer' }}
                                        />
                                        <span>Infinite Loop</span>
                                    </label>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        opacity: isInfiniteLoop ? 0.35 : 1
                                    }}>
                                        <span style={{ fontSize: '11px', color: '#c7d2fe' }}>⏱️</span>
                                        <input
                                            type="number"
                                            id="soundMinutesInput"
                                            min={1}
                                            max={1440}
                                            disabled={isInfiniteLoop}
                                            value={isInfiniteLoop ? customMins : (sleepMinutes || customMins)}
                                            onChange={(e) => {
                                                const val = Math.min(1440, Math.max(1, parseInt(e.target.value) || 1));
                                                setCustomMins(val);
                                                setSleepMinutes(val);
                                                if (isPlaying) SoundEngine.play(activeType, volume / 100, val);
                                            }}
                                            style={{
                                                width: '52px',
                                                padding: '2px 4px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(99, 102, 241, 0.5)',
                                                background: 'rgba(30, 41, 59, 0.9)',
                                                color: '#fff',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                textAlign: 'center',
                                                outline: 'none'
                                            }}
                                        />
                                        <span style={{ fontSize: '11px', color: '#c7d2fe', fontWeight: 700 }}>min</span>
                                    </div>

                                    {sleepRemaining !== null && !isInfiniteLoop && (
                                        <span
                                            id="soundSleepTimerBadge"
                                            style={{
                                                fontSize: '10px',
                                                padding: '2px 8px',
                                                borderRadius: '9999px',
                                                fontFamily: 'monospace',
                                                fontWeight: 800,
                                                background: 'rgba(245, 158, 11, 0.25)',
                                                color: '#f59e0b',
                                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                                flexShrink: 0
                                            }}
                                        >
                                            ⏳ {formatTimer(sleepRemaining)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};
