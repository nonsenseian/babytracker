import { SoundEngine } from './soundMachine';
import { calculateSweetNapPrediction } from './sweetNapEngine';
import type { ActivityLog } from '../types/log';
import type { ChildProfile } from '../types/profile';
import type { AppSettings } from '../types/state';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeechRecognition } from '@capgo/capacitor-speech-recognition';

export interface VoiceCommandCallbacks {
    onLogFeed: (subType: 'formula' | 'breastmilk' | 'nursing', amountMl: number) => void;
    onLogDiaper: (type: 'pee' | 'poop' | 'both') => void;
    onLogQuick: (type: 'vitamins' | 'tummy' | 'pump' | 'sleep', amountOrMinutes?: number) => void;
    onStartTimer?: (timer: 'feed' | 'pump' | 'sleep' | 'tummy') => void;
    onPauseTimer?: (timer: 'feed' | 'pump' | 'sleep' | 'tummy') => void;
    onSaveTimer?: (timer: 'feed' | 'pump' | 'sleep' | 'tummy') => void;
    onResetTimer?: (timer: 'feed' | 'pump' | 'sleep' | 'tummy') => void;
    onUndoLastActivity?: () => boolean | void;
    onConfirmationRequested?: (question: string | null) => void;
    onStatusQuery: (reply: string) => void;
    onError: (err: string) => void;
}

export interface DeviceVoiceProfile {
    voice: SpeechSynthesisVoice | null;
    rate: number;
    pitch: number;
    tier: 'neural-natural' | 'enhanced' | 'standard' | 'softened-fallback' | 'fallback';
    devicePlatform: 'ios' | 'android' | 'macos' | 'windows' | 'generic';
    displayName: string;
}

const spokenNumberMap: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'twenty-five': 25, 'thirty': 30, 'thirty-five': 35, 'forty': 40,
    'forty-five': 45, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80,
    'ninety': 90, 'hundred': 100
};

export function normalizeVoiceText(text: string): string {
    let clean = text.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Replace compound spoken numbers & time phrases
    clean = clean
        .replace(/\bone hundred twenty\b/g, '120')
        .replace(/\bone hundred fifty\b/g, '150')
        .replace(/\bone hundred eighty\b/g, '180')
        .replace(/\bone hundred\b/g, '100')
        .replace(/\btwo hundred\b/g, '200')
        .replace(/\bhalf an hour\b/g, '30 minutes')
        .replace(/\bone hour\b/g, '60 minutes')
        .replace(/\btwo hours\b/g, '120 minutes');

    for (const [word, num] of Object.entries(spokenNumberMap)) {
        clean = clean.replace(new RegExp(`\\b${word}\\b`, 'g'), String(num));
    }
    return clean;
}

class NightstandVoiceEngine {
    private recognition: any = null;
    private isListening: boolean = false;
    private userDisabled: boolean = true;
    private isMicEnabled: boolean = true;
    private isSpeakerEnabled: boolean = true;
    private restartTimeout: any = null;
    private callbacks: VoiceCommandCallbacks | null = null;
    private logsProvider: (() => ActivityLog[]) | null = null;
    private childProvider: (() => ChildProfile) | null = null;
    private settingsProvider: (() => AppSettings) | null = null;
    private speechListeners: ((text: string) => void)[] = [];
    private stateListeners: ((state: { isMic: boolean; isSpeaker: boolean }) => void)[] = [];
    private consecutiveFailures: number = 0;
    private pendingConfirmation: { type: 'undo'; timestamp: number } | null = null;
    private confirmationListeners: ((question: string | null) => void)[] = [];
    private nativeDebounceTimer: any = null;
    private lastProcessedNativeTranscript: string = '';

    constructor() {
        if (typeof window !== 'undefined') {
            try {
                const savedMic = localStorage.getItem('bt_voice_mic_enabled');
                if (savedMic !== null) {
                    this.isMicEnabled = savedMic === 'true';
                }
                const savedSpeaker = localStorage.getItem('bt_voice_speaker_enabled');
                if (savedSpeaker !== null) {
                    this.isSpeakerEnabled = savedSpeaker === 'true';
                }
            } catch (e) {}
        }
    }

    public onSpeech(listener: (text: string) => void): () => void {
        this.speechListeners.push(listener);
        return () => {
            this.speechListeners = this.speechListeners.filter(l => l !== listener);
        };
    }

    public onStateChange(listener: (state: { isMic: boolean; isSpeaker: boolean }) => void): () => void {
        this.stateListeners.push(listener);
        return () => {
            this.stateListeners = this.stateListeners.filter(l => l !== listener);
        };
    }

    public onConfirmationChange(listener: (question: string | null) => void): () => void {
        this.confirmationListeners.push(listener);
        return () => {
            this.confirmationListeners = this.confirmationListeners.filter(l => l !== listener);
        };
    }

    private notifyConfirmationListeners(question: string | null) {
        this.confirmationListeners.forEach(fn => {
            try { fn(question); } catch (e) {}
        });
    }

    public getPendingConfirmation() {
        return this.pendingConfirmation;
    }

    public cancelPendingConfirmation() {
        this.pendingConfirmation = null;
        this.notifyConfirmationListeners(null);
    }

    public getConsecutiveFailures(): number {
        return this.consecutiveFailures;
    }

    public resetConsecutiveFailures(): void {
        this.consecutiveFailures = 0;
    }

    private notifyStateChange() {
        const state = { isMic: this.isMicEnabled, isSpeaker: this.isSpeakerEnabled };
        this.stateListeners.forEach(fn => {
            try { fn(state); } catch (e) {}
        });
    }

    public isSupported(): boolean {
        if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
            return true;
        }
        return typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    }

    public isMicActive(): boolean {
        return this.isMicEnabled;
    }

    public getMicEnabled(): boolean {
        return this.isMicEnabled;
    }

    public isSpeakerActive(): boolean {
        return this.isSpeakerEnabled;
    }

    public getSpeakerEnabled(): boolean {
        return this.isSpeakerEnabled;
    }

    public async setMicEnabled(enabled: boolean): Promise<boolean> {
        this.isMicEnabled = enabled;
        try {
            localStorage.setItem('bt_voice_mic_enabled', enabled ? 'true' : 'false');
        } catch (e) {}
        this.notifyStateChange();

        if (enabled) {
            return await this.start();
        } else {
            this.stop();
            return false;
        }
    }

    public setSpeakerEnabled(enabled: boolean): void {
        this.isSpeakerEnabled = enabled;
        try {
            localStorage.setItem('bt_voice_speaker_enabled', enabled ? 'true' : 'false');
        } catch (e) {}
        if (!enabled && typeof window !== 'undefined' && window.speechSynthesis) {
            try {
                window.speechSynthesis.cancel();
            } catch (e) {}
        }
        this.notifyStateChange();
    }

    private cachedVoiceProfile: DeviceVoiceProfile | null = null;

    public detectDeviceVoiceProfile(): DeviceVoiceProfile {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            return {
                voice: null,
                rate: 1.0,
                pitch: 1.0,
                tier: 'fallback',
                devicePlatform: 'generic',
                displayName: 'Default System Voice'
            };
        }

        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) {
            return {
                voice: null,
                rate: 1.0,
                pitch: 1.0,
                tier: 'fallback',
                devicePlatform: 'generic',
                displayName: 'Default System Voice'
            };
        }

        const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '').toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isAndroid = /android/.test(ua);
        const isMac = /macintosh|mac os x/.test(ua) && !isIOS;
        const isWindows = /windows/.test(ua);

        const enVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
        const candidateList = enVoices.length > 0 ? enVoices : voices;

        // 1. Device: iOS / Safari (iPhone, iPad)
        if (isIOS) {
            // Priority 1A: Apple Enhanced / Premium female voices
            const appleEnhanced = candidateList.find(v => {
                const name = v.name.toLowerCase();
                const isFemale = ['samantha', 'ava', 'nora', 'allison', 'serena', 'karen', 'zoe', 'susan', 'siri'].some(n => name.includes(n));
                const isEnhanced = name.includes('enhanced') || name.includes('premium');
                return isFemale && isEnhanced;
            });
            if (appleEnhanced) {
                return {
                    voice: appleEnhanced,
                    rate: 0.94,
                    pitch: 1.02,
                    tier: 'enhanced',
                    devicePlatform: 'ios',
                    displayName: `${appleEnhanced.name} (iOS Enhanced)`
                };
            }

            // Priority 1B: Standard Apple Siri / Samantha / Ava
            const appleStandard = candidateList.find(v => {
                const name = v.name.toLowerCase();
                return ['samantha', 'ava', 'nora', 'siri', 'serena', 'allison', 'karen', 'victoria'].some(n => name.includes(n));
            });
            if (appleStandard) {
                return {
                    voice: appleStandard,
                    rate: 0.94,
                    pitch: 1.02,
                    tier: 'standard',
                    devicePlatform: 'ios',
                    displayName: `${appleStandard.name} (Apple Maternal)`
                };
            }
        }

        // 2. Device: Windows (Edge / Chrome)
        if (isWindows) {
            // Priority 2A: Microsoft Online Natural / Neural female voices (Jenny, Aria, Ava, Emma, Sonia)
            const msNatural = candidateList.find(v => {
                const name = v.name.toLowerCase();
                const isNatural = name.includes('natural') || name.includes('online') || name.includes('neural');
                const isFemale = ['jenny', 'aria', 'ava', 'emma', 'sonia', 'libby', 'ana', 'michelle'].some(n => name.includes(n)) || name.includes('female');
                return isNatural && isFemale;
            });
            if (msNatural) {
                return {
                    voice: msNatural,
                    rate: 0.95,
                    pitch: 1.02,
                    tier: 'neural-natural',
                    devicePlatform: 'windows',
                    displayName: `${msNatural.name.split('-')[0].trim()} (Microsoft Natural AI)`
                };
            }

            // Priority 2B: Google US English / Google UK Female (much higher quality in Chrome on Windows than SAPI Zira)
            const googleNatural = candidateList.find(v => {
                const name = v.name.toLowerCase();
                return name.includes('google') && (name.includes('us english') || name.includes('uk english female'));
            });
            if (googleNatural) {
                return {
                    voice: googleNatural,
                    rate: 0.96,
                    pitch: 1.02,
                    tier: 'standard',
                    devicePlatform: 'windows',
                    displayName: 'Google US English (High Clarity)'
                };
            }

            // Priority 2C: Windows 11 downloaded Jenny/Aria local
            const msLocalModern = candidateList.find(v => {
                const name = v.name.toLowerCase();
                return ['jenny', 'aria', 'ava'].some(n => name.includes(n));
            });
            if (msLocalModern) {
                return {
                    voice: msLocalModern,
                    rate: 0.95,
                    pitch: 1.0,
                    tier: 'standard',
                    devicePlatform: 'windows',
                    displayName: `${msLocalModern.name} (Windows Modern)`
                };
            }

            // Priority 2D: Legacy SAPI Zira (Acoustically softened to eliminate harsh mechanical grating)
            const zira = candidateList.find(v => v.name.toLowerCase().includes('zira'));
            if (zira) {
                return {
                    voice: zira,
                    rate: 0.92,
                    pitch: 0.96,
                    tier: 'softened-fallback',
                    devicePlatform: 'windows',
                    displayName: 'Microsoft Zira (Acoustically Softened)'
                };
            }
        }

        // 3. Device: Android (Chrome / Samsung Internet)
        if (isAndroid) {
            const googleAndroid = candidateList.find(v => {
                const name = v.name.toLowerCase();
                return name.includes('google') || name.includes('en-us-x') || name.includes('female');
            });
            if (googleAndroid) {
                return {
                    voice: googleAndroid,
                    rate: 0.96,
                    pitch: 1.0,
                    tier: 'standard',
                    devicePlatform: 'android',
                    displayName: `${googleAndroid.name} (Google Speech)`
                };
            }
        }

        // 4. Device: macOS (Safari / Chrome)
        if (isMac) {
            const macEnhanced = candidateList.find(v => {
                const name = v.name.toLowerCase();
                return (name.includes('enhanced') || name.includes('premium')) && ['samantha', 'ava', 'victoria', 'serena'].some(n => name.includes(n));
            });
            if (macEnhanced) {
                return {
                    voice: macEnhanced,
                    rate: 0.94,
                    pitch: 1.02,
                    tier: 'enhanced',
                    devicePlatform: 'macos',
                    displayName: `${macEnhanced.name} (Mac Enhanced)`
                };
            }
            const macStandard = candidateList.find(v => {
                const name = v.name.toLowerCase();
                return ['samantha', 'ava', 'victoria', 'serena', 'karen'].some(n => name.includes(n));
            });
            if (macStandard) {
                return {
                    voice: macStandard,
                    rate: 0.94,
                    pitch: 1.02,
                    tier: 'standard',
                    devicePlatform: 'macos',
                    displayName: `${macStandard.name} (Mac Maternal)`
                };
            }
        }

        // 5. Universal Best Match across any browser/OS
        const universalNeural = candidateList.find(v => {
            const name = v.name.toLowerCase();
            return (name.includes('natural') || name.includes('neural') || name.includes('enhanced') || name.includes('online')) &&
                   (['jenny', 'aria', 'samantha', 'ava', 'serena', 'nora'].some(n => name.includes(n)) || name.includes('female'));
        });
        if (universalNeural) {
            return {
                voice: universalNeural,
                rate: 0.95,
                pitch: 1.02,
                tier: 'neural-natural',
                devicePlatform: 'generic',
                displayName: `${universalNeural.name} (Neural AI)`
            };
        }

        const universalFemale = candidateList.find(v => {
            const name = v.name.toLowerCase();
            return ['jenny', 'aria', 'samantha', 'ava', 'nora', 'victoria', 'serena', 'allison', 'google'].some(n => name.includes(n)) || name.includes('female');
        });
        if (universalFemale) {
            return {
                voice: universalFemale,
                rate: 0.95,
                pitch: 1.0,
                tier: 'standard',
                devicePlatform: 'generic',
                displayName: `${universalFemale.name}`
            };
        }

        return {
            voice: candidateList[0] || null,
            rate: 1.0,
            pitch: 1.0,
            tier: 'fallback',
            devicePlatform: 'generic',
            displayName: candidateList[0]?.name || 'System Default'
        };
    }

    public getActiveVoiceProfile(): DeviceVoiceProfile {
        if (!this.cachedVoiceProfile || !this.cachedVoiceProfile.voice) {
            this.cachedVoiceProfile = this.detectDeviceVoiceProfile();
        }
        return this.cachedVoiceProfile;
    }

    public getBestFemaleVoice(): SpeechSynthesisVoice | null {
        return this.getActiveVoiceProfile().voice;
    }

    public speak(text: string, onEnd?: () => void) {
        if (typeof window === 'undefined') return;

        // Broadcast to modal & UI listeners regardless of speaker mute
        this.speechListeners.forEach(fn => {
            try { fn(text); } catch (e) {}
        });

        // ADA Compliance: announce live speech to screen readers
        this.announceADA(text);

        // If speaker is muted, skip actual audio playback (Silent Voice Mode)
        if (!this.isSpeakerEnabled) {
            if (onEnd) onEnd();
            return;
        }

        if (!window.speechSynthesis) return;

        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const profile = this.getActiveVoiceProfile();
            const voice = profile.voice;
            if (voice) {
                utterance.voice = voice;
                utterance.lang = voice.lang || 'en-US';
            } else {
                utterance.lang = 'en-US';
            }
            utterance.rate = profile.rate;
            utterance.pitch = profile.pitch;
            if (onEnd) {
                utterance.onend = onEnd;
            }
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('speechSynthesis error:', e);
        }
    }

    public announceLog(log: ActivityLog) {
        let msg = '';
        if (log.category === 'diaper') {
            const type = log.subType === 'pee' ? 'Wet' : (log.subType === 'poop' ? 'Dirty' : 'Wet and Dirty');
            msg = `Logged ${type} Diaper.`;
        } else if (log.category === 'feeding') {
            const type = log.subType === 'formula' ? 'Formula' : (log.subType === 'breastmilk' ? 'Breastmilk' : 'Nursing');
            const amt = log.amountMl ? `${log.amountMl} mL` : (log.durationMinutes ? `${log.durationMinutes} minutes` : '');
            msg = `Logged Feed: ${type} ${amt}.`.trim();
        } else if (log.category === 'pumping') {
            msg = `Logged Pumping Session: ${log.amountMl || 100} mL.`;
        } else if (log.category === 'sleep') {
            msg = `Logged Sleep: ${log.durationMinutes || 60} minutes.`;
        } else if (log.category === 'tummy') {
            msg = `Logged ${log.durationMinutes || 5} minutes Tummy Time.`;
        } else if (log.category === 'bath') {
            msg = 'Logged Warm Bath.';
        } else if (log.category === 'health') {
            msg = 'Logged Health Vitals.';
        } else {
            msg = `Logged ${log.category} activity.`;
        }

        this.speak(msg);
    }

    public announceADA(text: string) {
        if (typeof document === 'undefined') return;
        let announcer = document.getElementById('voiceAriaAnnouncer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'voiceAriaAnnouncer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.style.position = 'absolute';
            announcer.style.width = '1px';
            announcer.style.height = '1px';
            announcer.style.padding = '0';
            announcer.style.margin = '-1px';
            announcer.style.overflow = 'hidden';
            announcer.style.clip = 'rect(0, 0, 0, 0)';
            announcer.style.border = '0';
            document.body.appendChild(announcer);
        }
        announcer.textContent = text;
    }

    public init(
        callbacks: VoiceCommandCallbacks,
        logsProvider: () => ActivityLog[],
        childProvider: () => ChildProfile,
        settingsProvider: () => AppSettings
    ) {
        this.callbacks = callbacks;
        this.logsProvider = logsProvider;
        this.childProvider = childProvider;
        this.settingsProvider = settingsProvider;

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            this.cachedVoiceProfile = this.detectDeviceVoiceProfile();
            window.speechSynthesis.onvoiceschanged = () => {
                this.cachedVoiceProfile = this.detectDeviceVoiceProfile();
            };
        }
    }

    private isActionableCommand(text: string): boolean {
        const norm = text.toLowerCase();
        if (this.pendingConfirmation) {
            if (/\b(yes|yeah|sure|confirm|ok|okay|yep|no|nope|cancel|nevermind|never mind|stop)\b/i.test(norm)) {
                return true;
            }
        }
        if (norm.includes('summary')) return true;
        if (norm.includes('undo')) return true;
        if (/\b(feed|pump|sleep|nap|tummy)\b/i.test(norm) && /\b(start|resume|pause|stop|save|reset)\b/i.test(norm)) return true;
        if (/\b(pee|poop|diaper|wet|dirty)\b/i.test(norm)) return true;
        if (/\b(bottle|formula|breastmilk|breast milk|nursing|nurse)\b/i.test(norm)) return true;
        if (/\b(vitamins?|tummy time|pumping)\b/i.test(norm)) return true;
        if (/\b(status|how long|when did|last)\b/i.test(norm)) return true;
        if (/\b(white noise|lullaby|shush|rain|ocean|vacuum|fan)\b/i.test(norm)) return true;
        return false;
    }

    private async startNativeRecognition(): Promise<boolean> {
        try {
            console.log('[VoiceEngine] Checking native speech permissions...');
            const status = await NativeSpeechRecognition.checkPermissions();
            console.log('[VoiceEngine] checkPermissions result:', status);
            if (status.speechRecognition !== 'granted') {
                console.log('[VoiceEngine] Requesting speech permissions...');
                const req = await NativeSpeechRecognition.requestPermissions();
                console.log('[VoiceEngine] requestPermissions result:', req);
                if (req.speechRecognition !== 'granted') {
                    this.userDisabled = true;
                    const msg = 'Microphone and speech recognition permissions denied. Please enable them in iPhone Settings > NovaBaby.';
                    if (this.callbacks) this.callbacks.onError(msg);
                    this.speechListeners.forEach(fn => { try { fn(msg); } catch (e) {} });
                    return false;
                }
            }

            await NativeSpeechRecognition.removeAllListeners();

            await NativeSpeechRecognition.addListener('partialResults', (data: { matches?: string[] }) => {
                if (data?.matches && data.matches.length > 0) {
                    const transcript = data.matches[0].trim().toLowerCase();
                    if (!transcript || transcript === this.lastProcessedNativeTranscript) return;

                    clearTimeout(this.nativeDebounceTimer);
                    if (this.isActionableCommand(transcript)) {
                        this.lastProcessedNativeTranscript = transcript;
                        this.handleTranscript(transcript);
                    } else {
                        this.nativeDebounceTimer = setTimeout(() => {
                            this.lastProcessedNativeTranscript = transcript;
                            this.handleTranscript(transcript);
                        }, 1200);
                    }
                }
            });

            await NativeSpeechRecognition.addListener('listeningState', (data: { status?: 'started' | 'stopped' }) => {
                if (data.status === 'started') {
                    this.isListening = true;
                } else if (data.status === 'stopped') {
                    this.isListening = false;
                    // Auto-restart native recognizer if mic is still enabled
                    if (!this.userDisabled && this.isMicEnabled) {
                        clearTimeout(this.restartTimeout);
                        this.restartTimeout = setTimeout(() => {
                            if (!this.userDisabled && this.isMicEnabled && !this.isListening) {
                                this.startNativeRecognition();
                            }
                        }, 300);
                    }
                }
            });

            await NativeSpeechRecognition.start({
                language: 'en-US',
                maxResults: 2,
                prompt: 'Say a baby tracking command...',
                partialResults: true,
                popup: false,
                contextualStrings: [
                    'Hey Nova', 'Nova', 'feed timer', 'pump timer', 'nap timer', 'sleep timer',
                    'tummy time', 'dirty diaper', 'wet diaper', 'poop', 'pee', 'formula',
                    'breastmilk', 'summary', 'undo'
                ]
            });

            this.isListening = true;
            this.userDisabled = false;
            SoundEngine.playChime('wake');
            return true;
        } catch (err: any) {
            console.warn('Native speech recognition start error:', err);
            this.isListening = false;
            const errMsg = `Voice initialization error: ${err?.message || err}. Please check permissions in iPhone Settings > NovaBaby.`;
            if (this.callbacks) this.callbacks.onError(errMsg);
            this.speechListeners.forEach(fn => { try { fn(errMsg); } catch (e) {} });
            return false;
        }
    }

    public async start(): Promise<boolean> {
        if (!this.isSupported()) {
            return false;
        }

        // Native iOS & Android Speech Recognition via Capacitor
        if (Capacitor.isNativePlatform()) {
            this.userDisabled = false;
            return await this.startNativeRecognition();
        }

        // Web Browser Speech Recognition fallback (Chrome, Edge, Safari HTTPS)
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        // On mobile WebKit/Safari, prompt for microphone permission via getUserMedia first if available
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(t => t.stop());
            } catch (mediaErr: any) {
                console.warn('Microphone permission pre-flight error:', mediaErr);
                if (mediaErr?.name === 'NotAllowedError' || mediaErr?.name === 'PermissionDeniedError') {
                    const msg = 'Microphone permission denied. In Safari address bar, tap "aA" -> Website Settings -> Microphone -> Allow.';
                    if (this.callbacks) this.callbacks.onError(msg);
                    this.speechListeners.forEach(fn => { try { fn(msg); } catch (e) {} });
                    return false;
                }
            }
        }

        if (!this.recognition) {
            this.recognition = new SpeechRec();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                SoundEngine.playChime('wake');
            };

            this.recognition.onresult = (event: any) => {
                const results = event.results;
                const lastIndex = results.length - 1;
                if (!results[lastIndex] || !results[lastIndex][0]) return;
                const transcript = results[lastIndex][0].transcript.trim().toLowerCase();
                this.handleTranscript(transcript);
            };

            this.recognition.onerror = (event: any) => {
                console.warn('SpeechRecognition error:', event.error);
                if (event.error === 'not-allowed') {
                    this.userDisabled = true;
                    this.stop();
                    const msg = 'Microphone permission denied. In Safari address bar, tap "aA" -> Website Settings -> Microphone -> Allow.';
                    if (this.callbacks) this.callbacks.onError(msg);
                    this.speechListeners.forEach(fn => { try { fn(msg); } catch (e) {} });
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                // Watchdog restart if voice mode is still enabled
                if (!this.userDisabled) {
                    clearTimeout(this.restartTimeout);
                    this.restartTimeout = setTimeout(() => {
                        try {
                            if (!this.isListening && !this.userDisabled) {
                                this.recognition.start();
                            }
                        } catch (e) {}
                    }, 300);
                }
            };
        }

        this.userDisabled = false;
        try {
            this.recognition.start();
            this.isListening = true;
            return true;
        } catch (e) {
            console.warn('SpeechRecognition start error:', e);
            return false;
        }
    }

    public stop() {
        this.userDisabled = true;
        clearTimeout(this.restartTimeout);
        clearTimeout(this.nativeDebounceTimer);

        if (Capacitor.isNativePlatform()) {
            try {
                NativeSpeechRecognition.stop();
                NativeSpeechRecognition.removeAllListeners();
            } catch (e) {}
            this.isListening = false;
            return;
        }

        if (this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
        }
        this.isListening = false;
    }

    public getListeningState(): boolean {
        return this.isListening;
    }

    public generateSummaryReply(): string {
        const child = this.childProvider ? this.childProvider() : { name: 'Baby' };
        const logs = this.logsProvider ? this.logsProvider() : [];
        let unit: 'mL' | 'oz' = 'mL';
        if (typeof window !== 'undefined') {
            unit = (localStorage.getItem('bt_app_unit') as 'mL' | 'oz') || 'mL';
        }

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const todayLogs = logs.filter(l => l.dateStr === todayStr);

        // 1. Milk volume today
        const feedLogs = todayLogs.filter(l => l.category === 'feeding');
        const totalMl = feedLogs.reduce((sum, l) => sum + (l.amountMl || 0), 0);
        let milkText = `${totalMl} mL`;
        if (unit === 'oz') {
            const totalOz = Math.round((totalMl / 29.5735) * 10) / 10;
            milkText = `${totalOz} oz`;
        }

        // 2. Nap duration today
        const sleepLogs = todayLogs.filter(l => l.category === 'sleep');
        const totalSleepMinutes = sleepLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
        let napText = `${totalSleepMinutes} minutes`;
        if (totalSleepMinutes === 60) {
            napText = '1 hour';
        } else if (totalSleepMinutes > 60 && totalSleepMinutes % 60 === 0) {
            napText = `${totalSleepMinutes / 60} hours`;
        } else if (totalSleepMinutes > 60) {
            const hrs = Math.floor(totalSleepMinutes / 60);
            const mins = totalSleepMinutes % 60;
            napText = `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ${mins} minutes`;
        }

        // 3. Tummy time duration today
        const tummyLogs = todayLogs.filter(l => l.category === 'tummy');
        const totalTummyMinutes = tummyLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

        const rawName = child.name || 'Baby';
        const formattedName = rawName.replace(/^baby\s+/i, '').trim() || 'Baby';

        return `Baby ${formattedName} has had ${milkText} of Milk today, napped for ${napText}, and had ${totalTummyMinutes} minutes of Tummy Time.`;
    }

    public simulateCommand(cmd: string) {
        SoundEngine.playChime('wake');
        if (this.pendingConfirmation) {
            this.handleTranscript(cmd);
            return;
        }
        const effective = /\bnova\b/i.test(cmd) ? cmd : `Nova, ${cmd}`;
        this.handleTranscript(effective);
    }

    public handleTranscript(rawTranscript: string) {
        const norm = normalizeVoiceText(rawTranscript);
        const child = this.childProvider ? this.childProvider() : { name: 'Ian' };
        const babyName = (child.name || 'ian').toLowerCase();
        const settings = this.settingsProvider ? this.settingsProvider() : null;

        // 1. Check if we are waiting for a Yes/No confirmation (e.g. for Undo command)
        if (this.pendingConfirmation) {
            if (Date.now() - this.pendingConfirmation.timestamp > 30000) {
                this.pendingConfirmation = null;
                this.notifyConfirmationListeners(null);
            } else {
                const cleanWord = norm.replace(/\b(hey|okay|hi|ok)?\s*nova(baby)?\b/gi, '').trim();
                const isAffirmative =
                    /\b(yes|yeah|yep|confirm|sure|do it|please|ok|okay)\b/i.test(cleanWord) ||
                    /\b(yes|yeah|yep|confirm|sure|do it|please|ok|okay)\b/i.test(norm);
                const isNegative =
                    /\b(no|nope|cancel|nevermind|never mind|stop|don t|do not)\b/i.test(cleanWord) ||
                    /\b(no|nope|cancel|nevermind|never mind|stop|don t|do not)\b/i.test(norm);

                if (isAffirmative) {
                    if (this.callbacks?.onUndoLastActivity) {
                        this.callbacks.onUndoLastActivity();
                    }
                    this.pendingConfirmation = null;
                    this.notifyConfirmationListeners(null);
                    this.consecutiveFailures = 0;
                    const reply = "Undid the last activity.";
                    this.speak(reply);
                    if (this.callbacks?.onStatusQuery) this.callbacks.onStatusQuery(reply);
                    SoundEngine.playChime('success');
                    return;
                }

                if (isNegative) {
                    this.pendingConfirmation = null;
                    this.notifyConfirmationListeners(null);
                    this.consecutiveFailures = 0;
                    const reply = "Okay, canceled undo.";
                    this.speak(reply);
                    if (this.callbacks?.onStatusQuery) this.callbacks.onStatusQuery(reply);
                    SoundEngine.playChime('success');
                    return;
                }
            }
        }

        // 2. Strict Wake Trigger requirement: Only perform actions when first prompted with "Hey Nova" or "Nova"
        const hasTrigger =
            /\b(hey|okay|hi|ok)\s+nova(baby)?\b/i.test(norm) ||
            /\bnova(baby)?\b/i.test(norm) ||
            /\b(hey|okay|hi|ok)\s+nova(baby)?\b/i.test(rawTranscript) ||
            /\bnova(baby)?\b/i.test(rawTranscript) ||
            (settings?.voiceTrigger === 'always');

        if (!hasTrigger) {
            return;
        }

        SoundEngine.playChime('wake');

        let command = norm
            .replace(/\b(hey|okay|hi|ok)\s+nova(baby)?\b/gi, '')
            .replace(/\bnova(baby)?\b/gi, '')
            .replace(/\b(hey|okay|hi|ok)\s+tracker\b/gi, '')
            .replace(/\btracker\b/gi, '')
            .replace(new RegExp(`\\bhey ${babyName}\\b`, 'gi'), '')
            .trim();

        if (!command) {
            this.consecutiveFailures = 0;
            this.speak("I'm listening. How can I help?");
            return;
        }

        this.executeCommand(command, rawTranscript);
    }

    private executeCommand(rawCommand: string, _original: string) {
        const norm = normalizeVoiceText(rawCommand);
        let command = norm
            .replace(/^(hey|okay|hi|ok)\s+(nova(baby)?|tracker|[a-z]+)\s*/i, '')
            .replace(/^(nova(baby)?|tracker)\s*/i, '')
            .replace(/^(please|can you|could you|would you)\s*/i, '')
            .replace(/^(i need you to|help me)\s*/i, '')
            .replace(/^(log a|log an|log|record a|record an|record|track a|track an|track)\s*/i, '')
            .trim();

        const logs = this.logsProvider ? this.logsProvider() : [];
        const child = this.childProvider ? this.childProvider() : { name: 'Baby' };

        // -------------------------------------------------------------------------
        // 1. Undo Command with Yes/No Confirmation (Requirement 5)
        // -------------------------------------------------------------------------
        if (command.includes('undo')) {
            if (logs.length === 0) {
                const reply = "There are no recent activities to undo.";
                this.speak(reply);
                if (this.callbacks?.onStatusQuery) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('error');
                return;
            }

            this.pendingConfirmation = {
                type: 'undo',
                timestamp: Date.now()
            };
            this.consecutiveFailures = 0;
            const question = "Would you like me to undo the last activity?";
            this.speak(question);
            if (this.callbacks?.onConfirmationRequested) {
                this.callbacks.onConfirmationRequested(question);
            }
            this.notifyConfirmationListeners(question);
            SoundEngine.playChime('wake');
            return;
        }

        // -------------------------------------------------------------------------
        // 2. Summary Command (Requirement 4)
        // -------------------------------------------------------------------------
        if (command.includes('summary')) {
            const reply = this.generateSummaryReply();
            this.speak(reply);
            if (this.callbacks?.onStatusQuery) this.callbacks.onStatusQuery(reply);
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        // -------------------------------------------------------------------------
        // 3. Spoken Status Queries
        // -------------------------------------------------------------------------
        if (command.includes('last feed') || command.includes('when was the last feed') || command.includes('last bottle')) {
            const lastFeed = logs.find(l => l.category === 'feeding');
            if (lastFeed) {
                const diffMins = Math.max(0, Math.round((Date.now() - lastFeed.timestamp) / 60000));
                const hours = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                const timeAgo = hours > 0 ? `${hours} hr ${mins} min ago` : `${mins} minutes ago`;
                const type = lastFeed.subType === 'formula' ? 'Formula' : (lastFeed.subType === 'nursing' ? 'Nursing' : 'Breastmilk');
                const amt = lastFeed.amountMl ? `${lastFeed.amountMl} mL` : `${lastFeed.durationMinutes || 20} minutes`;
                const reply = `Last feed was ${amt} of ${type} at ${lastFeed.timeStr}, about ${timeAgo}.`;
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
            } else {
                const reply = 'No feedings logged yet today.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
            }
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        if (command.includes('last diaper') || command.includes('when was the last diaper')) {
            const lastDiaper = logs.find(l => l.category === 'diaper');
            if (lastDiaper) {
                const diffMins = Math.max(0, Math.round((Date.now() - lastDiaper.timestamp) / 60000));
                const timeAgo = diffMins > 60 ? `${Math.floor(diffMins / 60)} hr ${diffMins % 60} min ago` : `${diffMins} min ago`;
                const type = lastDiaper.subType === 'pee' ? 'wet' : (lastDiaper.subType === 'poop' ? 'dirty' : 'wet and dirty');
                const reply = `Last diaper was ${type} at ${lastDiaper.timeStr}, about ${timeAgo}.`;
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
            } else {
                const reply = 'No diapers logged yet today.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
            }
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        if (command.includes('next nap') || command.includes('when is the next nap') || command.includes('sweet spot') || command.includes('sweetspot') || command.includes('wake window') || command.includes('nap prediction')) {
            const birthDateStr = ('birthDate' in child && child.birthDate) ? child.birthDate : '';
            const pred = calculateSweetNapPrediction({
                birthDateStr,
                logs,
                isSleepingNow: false,
                now: Date.now()
            });
            let reply: string;
            if (pred.minutesUntilTarget > 0) {
                const targetTime = new Date(pred.targetNapStartTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                reply = `${child.name}'s next nap SweetSpot is in about ${pred.minutesUntilTarget} minutes at ${targetTime}.`;
            } else if (pred.minutesUntilTarget >= -20) {
                reply = `${child.name} is currently in their sweet spot nap window. It is ideal to soothe them for sleep now.`;
            } else {
                reply = `${child.name}'s wake window was exceeded by about ${Math.abs(pred.minutesUntilTarget)} minutes. They may be approaching the overtired zone.`;
            }
            this.speak(reply);
            if (this.callbacks) this.callbacks.onStatusQuery(reply);
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        if (command.includes('how much milk') || command.includes('milk today') || command.includes('total feed')) {
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const feeds = logs.filter(l => l.category === 'feeding' && l.dateStr === todayStr);
            const totalMl = feeds.reduce((sum, l) => sum + (l.amountMl || 0), 0);
            const reply = `${child.name} has had ${totalMl} mL across ${feeds.length} feeds today.`;
            this.speak(reply);
            if (this.callbacks) this.callbacks.onStatusQuery(reply);
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        if (command.includes('status') || command.includes('how is baby')) {
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const todayLogs = logs.filter(l => l.dateStr === todayStr);
            const feeds = todayLogs.filter(l => l.category === 'feeding');
            const totalMl = feeds.reduce((sum, l) => sum + (l.amountMl || 0), 0);
            const pees = todayLogs.filter(l => l.category === 'diaper' && (l.subType === 'pee' || l.subType === 'both')).length;
            const poops = todayLogs.filter(l => l.category === 'diaper' && (l.subType === 'poop' || l.subType === 'both')).length;
            const reply = `Today for ${child.name}: ${feeds.length} feeds totaling ${totalMl} mL, ${pees} wet diapers, and ${poops} dirty diapers.`;
            this.speak(reply);
            if (this.callbacks) this.callbacks.onStatusQuery(reply);
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        // -------------------------------------------------------------------------
        // 4. Timer Control Commands (Requirement 2: Start, Resume, Pause, Stop, Save, Reset)
        // -------------------------------------------------------------------------
        const isTimerExplicit = /\btimers?\b/i.test(command);
        const hasResume = /\b(resume|resumed|continue|unpause)\b/i.test(command);
        const hasStart = !hasResume && /\b(start|started|begin|fell asleep|put baby down|put down baby|kick off)\b/i.test(command);
        const hasStop = /\b(stop|stopped|freeze)\b/i.test(command);
        const hasPause = !hasResume && !hasStop && /\b(pause|paused|hold)\b/i.test(command);
        const hasSave = /\b(save|saved|finish|finished|done|woke up|is awake|wake up|complete|completed)\b/i.test(command);
        const hasReset = /\b(reset|clear|cancel|discard|restart)\b/i.test(command);

        const hasAnyTimerAction = hasResume || hasStart || hasPause || hasStop || hasSave || hasReset;

        // Feed Timer
        const isFeedTimer = (command.includes('feed') || command.includes('feeding') || command.includes('nursing') || (isTimerExplicit && command.includes('bottle'))) &&
            hasAnyTimerAction;
        if (isFeedTimer) {
            if (hasResume) {
                if (this.callbacks?.onStartTimer) this.callbacks.onStartTimer('feed');
                const reply = 'Resumed Feed timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasStart) {
                if (this.callbacks?.onStartTimer) this.callbacks.onStartTimer('feed');
                const reply = 'Started Feed timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasStop) {
                if (this.callbacks?.onPauseTimer) this.callbacks.onPauseTimer('feed');
                const reply = 'Stopped Feed timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasPause) {
                if (this.callbacks?.onPauseTimer) this.callbacks.onPauseTimer('feed');
                const reply = 'Paused Feed timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasSave) {
                if (this.callbacks?.onSaveTimer) this.callbacks.onSaveTimer('feed');
                const reply = 'Saved Feed timer session.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasReset) {
                if (this.callbacks?.onResetTimer) this.callbacks.onResetTimer('feed');
                const reply = 'Reset Feed timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
        }

        // Pump Timer
        const isPumpTimer = (command.includes('pump') || command.includes('pumping')) &&
            hasAnyTimerAction;
        if (isPumpTimer) {
            if (hasResume) {
                if (this.callbacks?.onStartTimer) this.callbacks.onStartTimer('pump');
                const reply = 'Resumed Pump timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasStart) {
                if (this.callbacks?.onStartTimer) this.callbacks.onStartTimer('pump');
                const reply = 'Started Pump timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasStop) {
                if (this.callbacks?.onPauseTimer) this.callbacks.onPauseTimer('pump');
                const reply = 'Stopped Pump timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasPause) {
                if (this.callbacks?.onPauseTimer) this.callbacks.onPauseTimer('pump');
                const reply = 'Paused Pump timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasSave) {
                if (this.callbacks?.onSaveTimer) this.callbacks.onSaveTimer('pump');
                const reply = 'Saved Pump timer session.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasReset) {
                if (this.callbacks?.onResetTimer) this.callbacks.onResetTimer('pump');
                const reply = 'Reset Pump timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
        }

        // Nap / Sleep Timer
        const isSleepTimer = (command.includes('nap') || command.includes('sleep') || command.includes('asleep') || command.includes('woke up') || command.includes('is awake') || command.includes('wake up') || command.includes('put baby down') || command.includes('put down baby')) &&
            hasAnyTimerAction;
        if (isSleepTimer) {
            if (hasResume) {
                if (this.callbacks?.onStartTimer) this.callbacks.onStartTimer('sleep');
                const reply = 'Resumed Nap timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasStart) {
                if (this.callbacks?.onStartTimer) this.callbacks.onStartTimer('sleep');
                const reply = 'Started Nap timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasStop) {
                if (this.callbacks?.onPauseTimer) this.callbacks.onPauseTimer('sleep');
                const reply = 'Stopped Nap timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasPause) {
                if (this.callbacks?.onPauseTimer) this.callbacks.onPauseTimer('sleep');
                const reply = 'Paused Nap timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasSave) {
                if (this.callbacks?.onSaveTimer) this.callbacks.onSaveTimer('sleep');
                const reply = 'Saved Nap timer session.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasReset) {
                if (this.callbacks?.onResetTimer) this.callbacks.onResetTimer('sleep');
                const reply = 'Reset Nap timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
        }

        // Tummy Time Timer
        const isTummyTimer = (command.includes('tummy') || command.includes('tummy time')) &&
            hasAnyTimerAction;
        if (isTummyTimer) {
            if (hasResume) {
                if (this.callbacks?.onStartTimer) this.callbacks.onStartTimer('tummy');
                const reply = 'Resumed Tummy Time timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasStart) {
                if (this.callbacks?.onStartTimer) this.callbacks.onStartTimer('tummy');
                const reply = 'Started Tummy Time timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasStop) {
                if (this.callbacks?.onPauseTimer) this.callbacks.onPauseTimer('tummy');
                const reply = 'Stopped Tummy Time timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasPause) {
                if (this.callbacks?.onPauseTimer) this.callbacks.onPauseTimer('tummy');
                const reply = 'Paused Tummy Time timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasSave) {
                if (this.callbacks?.onSaveTimer) this.callbacks.onSaveTimer('tummy');
                const reply = 'Saved Tummy Time timer session.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
            if (hasReset) {
                if (this.callbacks?.onResetTimer) this.callbacks.onResetTimer('tummy');
                const reply = 'Reset Tummy Time timer.';
                this.speak(reply);
                if (this.callbacks) this.callbacks.onStatusQuery(reply);
                SoundEngine.playChime('success');
                this.consecutiveFailures = 0;
                return;
            }
        }

        // -------------------------------------------------------------------------
        // 5. Spoken Diaper Logging Actions
        // -------------------------------------------------------------------------
        if ((command.includes('wet') && (command.includes('dirty') || command.includes('poop'))) ||
            (command.includes('pee') && command.includes('poop')) ||
            (command.includes('poop') && command.includes('pee')) ||
            command === 'both' || command.includes('both diaper')) {
            if (this.callbacks) this.callbacks.onLogDiaper('both');
            this.speak('Logged Wet & Dirty Diaper.');
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        if (command.includes('poop') || command.includes('dirty') || command.includes('bowel') || command.includes('soiled') || command.includes('bm') || command.includes('number two')) {
            if (this.callbacks) this.callbacks.onLogDiaper('poop');
            this.speak('Logged Dirty Diaper.');
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        if (command.includes('pee') || command.includes('wet') || command.includes('number one') || command.includes('urinated')) {
            if (this.callbacks) this.callbacks.onLogDiaper('pee');
            this.speak('Logged Wet Diaper.');
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        // -------------------------------------------------------------------------
        // 6. Quick Logging Actions (Vitamins, Feeds, Tummy, Pump, Sleep)
        // -------------------------------------------------------------------------
        if (command.includes('vitamins') || command.includes('vitamin')) {
            if (this.callbacks) this.callbacks.onLogQuick('vitamins', 20);
            this.speak('Logged Daily Vitamins: 20 mL.');
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        if (command.includes('formula')) {
            const numMatch = command.match(/(\d+(\.\d+)?)\s*(ml|ounces|oz)?/);
            let amountMl = 60;
            if (numMatch) {
                const amount = parseFloat(numMatch[1]);
                const isOz = numMatch[3] === 'oz' || numMatch[3] === 'ounces';
                amountMl = isOz ? Math.round(amount * 29.5735) : Math.round(amount);
            }
            if (this.callbacks) this.callbacks.onLogFeed('formula', amountMl);
            this.speak(`Logged Feed: Formula ${amountMl} mL.`);
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        if (command.includes('breastmilk') || command.includes('breast milk')) {
            const numMatch = command.match(/(\d+(\.\d+)?)\s*(ml|ounces|oz)?/);
            let amountMl = 60;
            if (numMatch) {
                const amount = parseFloat(numMatch[1]);
                const isOz = numMatch[3] === 'oz' || numMatch[3] === 'ounces';
                amountMl = isOz ? Math.round(amount * 29.5735) : Math.round(amount);
            }
            if (this.callbacks) this.callbacks.onLogFeed('breastmilk', amountMl);
            this.speak(`Logged Feed: Breastmilk ${amountMl} mL.`);
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        if (command.includes('nursing') || command.includes('nurse')) {
            const numMatch = command.match(/(\d+)\s*(min|minute|minutes)?/);
            const minutes = numMatch ? parseInt(numMatch[1], 10) : 15;
            if (this.callbacks) this.callbacks.onLogFeed('nursing', 0);
            this.speak(`Logged Nursing Feed: ${minutes} minutes.`);
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        if (command.includes('tummy') || command.includes('tummy time')) {
            const numMatch = command.match(/(\d+)\s*(min|minute|minutes)?/);
            const minutes = numMatch ? parseInt(numMatch[1], 10) : 5;
            if (this.callbacks) this.callbacks.onLogQuick('tummy', minutes);
            this.speak(`Logged ${minutes} Minutes Tummy Time.`);
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        if (command.includes('pump') || command.includes('pumping')) {
            const numMatch = command.match(/(\d+)\s*(ml|ounces|oz)?/);
            let amountMl = 100;
            if (numMatch) {
                const amount = parseFloat(numMatch[1]);
                const isOz = numMatch[3] === 'oz' || numMatch[3] === 'ounces';
                amountMl = isOz ? Math.round(amount * 29.5735) : Math.round(amount);
            }
            if (this.callbacks) this.callbacks.onLogQuick('pump', amountMl);
            this.speak(`Logged Pumping Session: ${amountMl} mL.`);
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        if (command.includes('nap') || command.includes('sleep')) {
            const numMatch = command.match(/(\d+)\s*(min|minute|minutes|hour|hours)?/);
            let minutes = 60;
            if (numMatch) {
                const val = parseInt(numMatch[1], 10);
                const isHours = numMatch[3] && numMatch[3].startsWith('hour');
                minutes = isHours ? val * 60 : val;
            }
            if (this.callbacks) this.callbacks.onLogQuick('sleep', minutes);
            this.speak(minutes === 60 ? 'Logged 1 Hour Nap.' : `Logged ${minutes} Minute Nap.`);
            SoundEngine.playChime('success');
            this.consecutiveFailures = 0;
            return;
        }

        // -------------------------------------------------------------------------
        // 7. Unrecognized Command Handling (Requirement 3)
        // -------------------------------------------------------------------------
        this.consecutiveFailures++;
        let failReply: string;
        if (this.consecutiveFailures >= 3) {
            failReply = "I'm sorry, I don't understand that command. Try another one.";
        } else {
            failReply = "I didn't quite catch that, can you try again?";
        }
        this.speak(failReply);
        if (this.callbacks?.onStatusQuery) this.callbacks.onStatusQuery(failReply);
        if (this.callbacks?.onError) this.callbacks.onError(failReply);
        SoundEngine.playChime('error');
    }
}

if (typeof window !== 'undefined') {
    if (!(window as any).__voiceAssistantInstance) {
        (window as any).__voiceAssistantInstance = new NightstandVoiceEngine();
    }
}

export const VoiceAssistant: NightstandVoiceEngine =
    (typeof window !== 'undefined' && (window as any).__voiceAssistantInstance)
        ? (window as any).__voiceAssistantInstance
        : new NightstandVoiceEngine();

if (typeof window !== 'undefined') {
    (window as any).VoiceAssistant = VoiceAssistant;
}
