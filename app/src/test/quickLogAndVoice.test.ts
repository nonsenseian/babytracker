import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VoiceAssistant } from '../engines/voiceEngine';
import type { ActivityLog } from '../types/log';

describe('Sprint 42: Voice Assistant Decoupled Controls & Phrasing', () => {
    beforeEach(() => {
        // Reset state
        VoiceAssistant.setMicEnabled(true);
        VoiceAssistant.setSpeakerEnabled(true);
    });

    it('independently toggles microphone without affecting speaker', () => {
        expect(VoiceAssistant.isMicActive()).toBe(true);
        expect(VoiceAssistant.isSpeakerActive()).toBe(true);

        VoiceAssistant.setMicEnabled(false);
        expect(VoiceAssistant.isMicActive()).toBe(false);
        expect(VoiceAssistant.isSpeakerActive()).toBe(true); // speaker remains enabled

        VoiceAssistant.setMicEnabled(true);
        expect(VoiceAssistant.isMicActive()).toBe(true);
    });

    it('independently toggles speaker without affecting microphone', () => {
        expect(VoiceAssistant.isMicActive()).toBe(true);
        expect(VoiceAssistant.isSpeakerActive()).toBe(true);

        VoiceAssistant.setSpeakerEnabled(false);
        expect(VoiceAssistant.isSpeakerActive()).toBe(false);
        expect(VoiceAssistant.isMicActive()).toBe(true); // mic remains active

        VoiceAssistant.setSpeakerEnabled(true);
        expect(VoiceAssistant.isSpeakerActive()).toBe(true);
    });

    it('supports all 4 operational modality combinations', () => {
        // Mode 1: Mic ON, Speaker ON (Two-Way)
        VoiceAssistant.setMicEnabled(true);
        VoiceAssistant.setSpeakerEnabled(true);
        expect(VoiceAssistant.isMicActive()).toBe(true);
        expect(VoiceAssistant.isSpeakerActive()).toBe(true);

        // Mode 2: Mic ON, Speaker OFF (Silent Voice Commands)
        VoiceAssistant.setMicEnabled(true);
        VoiceAssistant.setSpeakerEnabled(false);
        expect(VoiceAssistant.isMicActive()).toBe(true);
        expect(VoiceAssistant.isSpeakerActive()).toBe(false);

        // Mode 3: Mic OFF, Speaker ON (Audio Talkback Only)
        VoiceAssistant.setMicEnabled(false);
        VoiceAssistant.setSpeakerEnabled(true);
        expect(VoiceAssistant.isMicActive()).toBe(false);
        expect(VoiceAssistant.isSpeakerActive()).toBe(true);

        // Mode 4: Mic OFF, Speaker OFF (Fully Muted)
        VoiceAssistant.setMicEnabled(false);
        VoiceAssistant.setSpeakerEnabled(false);
        expect(VoiceAssistant.isMicActive()).toBe(false);
        expect(VoiceAssistant.isSpeakerActive()).toBe(false);
    });

    it('notifies listeners when state changes', () => {
        const listener = vi.fn();
        const unsub = VoiceAssistant.onStateChange(listener);

        VoiceAssistant.setSpeakerEnabled(false);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ isSpeaker: false }));

        VoiceAssistant.setMicEnabled(false);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ isMic: false }));

        unsub();
    });

    it('formats announceLog phrases precisely as required', () => {
        let lastSpoken = '';
        const unsub = VoiceAssistant.onSpeech((text) => {
            lastSpoken = text;
        });

        // 1. Wet Diaper
        VoiceAssistant.announceLog({
            id: '1',
            category: 'diaper',
            subType: 'pee',
            timestamp: Date.now(),
            dateStr: '2026-10-14',
            timeStr: '4:00 PM'
        } as ActivityLog);
        expect(lastSpoken).toBe('Logged Wet Diaper.');

        // 2. Dirty Diaper
        VoiceAssistant.announceLog({
            id: '2',
            category: 'diaper',
            subType: 'poop',
            timestamp: Date.now(),
            dateStr: '2026-10-14',
            timeStr: '4:05 PM'
        } as ActivityLog);
        expect(lastSpoken).toBe('Logged Dirty Diaper.');

        // 3. Breastmilk Feed
        VoiceAssistant.announceLog({
            id: '3',
            category: 'feeding',
            subType: 'breastmilk',
            amountMl: 50,
            timestamp: Date.now(),
            dateStr: '2026-10-14',
            timeStr: '4:10 PM'
        } as ActivityLog);
        expect(lastSpoken).toBe('Logged Feed: Breastmilk 50 mL.');

        // 4. Formula Feed
        VoiceAssistant.announceLog({
            id: '4',
            category: 'feeding',
            subType: 'formula',
            amountMl: 60,
            timestamp: Date.now(),
            dateStr: '2026-10-14',
            timeStr: '4:15 PM'
        } as ActivityLog);
        expect(lastSpoken).toBe('Logged Feed: Formula 60 mL.');

        unsub();
    });

    it('simulates voice commands with exact user phrasing and error catch', () => {
        let lastSpoken = '';
        const unsub = VoiceAssistant.onSpeech((text) => {
            lastSpoken = text;
        });

        // Unrecognized command
        VoiceAssistant.simulateCommand('play some jazz');
        expect(lastSpoken).toBe("I didn't quite catch that, can you try again?");

        // Diaper command
        VoiceAssistant.simulateCommand('poop');
        expect(lastSpoken).toBe('Logged Dirty Diaper.');

        // Formula command
        VoiceAssistant.simulateCommand('formula 90 ml');
        expect(lastSpoken).toBe('Logged Feed: Formula 90 mL.');

        // Breastmilk command
        VoiceAssistant.simulateCommand('breastmilk 50 ml');
        expect(lastSpoken).toBe('Logged Feed: Breastmilk 50 mL.');

        unsub();
    });

    it('supports starting, pausing, saving, and resetting all 4 timers via voice', () => {
        const onStartTimer = vi.fn();
        const onPauseTimer = vi.fn();
        const onSaveTimer = vi.fn();
        const onResetTimer = vi.fn();

        VoiceAssistant.init(
            {
                onLogFeed: vi.fn(),
                onLogDiaper: vi.fn(),
                onLogQuick: vi.fn(),
                onStartTimer,
                onPauseTimer,
                onSaveTimer,
                onResetTimer,
                onStatusQuery: vi.fn(),
                onError: vi.fn()
            },
            () => [],
            () => ({ name: 'Ian' } as any),
            () => ({} as any)
        );

        let lastSpoken = '';
        const unsub = VoiceAssistant.onSpeech((t) => { lastSpoken = t; });

        // 1. Feed Timer (all 4 actions)
        VoiceAssistant.simulateCommand('start feed timer');
        expect(onStartTimer).toHaveBeenCalledWith('feed');
        expect(lastSpoken).toBe('Started Feed timer.');

        VoiceAssistant.simulateCommand('pause feed timer');
        expect(onPauseTimer).toHaveBeenCalledWith('feed');
        expect(lastSpoken).toBe('Paused Feed timer.');

        VoiceAssistant.simulateCommand('save feed timer');
        expect(onSaveTimer).toHaveBeenCalledWith('feed');
        expect(lastSpoken).toBe('Saved Feed timer session.');

        VoiceAssistant.simulateCommand('reset feed timer');
        expect(onResetTimer).toHaveBeenCalledWith('feed');
        expect(lastSpoken).toBe('Reset Feed timer.');

        // 2. Pump Timer (all 4 actions)
        VoiceAssistant.simulateCommand('start pump timer');
        expect(onStartTimer).toHaveBeenCalledWith('pump');
        expect(lastSpoken).toBe('Started Pump timer.');

        VoiceAssistant.simulateCommand('pause pump timer');
        expect(onPauseTimer).toHaveBeenCalledWith('pump');
        expect(lastSpoken).toBe('Paused Pump timer.');

        VoiceAssistant.simulateCommand('save pump timer');
        expect(onSaveTimer).toHaveBeenCalledWith('pump');
        expect(lastSpoken).toBe('Saved Pump timer session.');

        VoiceAssistant.simulateCommand('reset pump timer');
        expect(onResetTimer).toHaveBeenCalledWith('pump');
        expect(lastSpoken).toBe('Reset Pump timer.');

        // 3. Nap / Sleep Timer (all 4 actions)
        VoiceAssistant.simulateCommand('start nap timer');
        expect(onStartTimer).toHaveBeenCalledWith('sleep');
        expect(lastSpoken).toBe('Started Nap timer.');

        VoiceAssistant.simulateCommand('pause nap timer');
        expect(onPauseTimer).toHaveBeenCalledWith('sleep');
        expect(lastSpoken).toBe('Paused Nap timer.');

        VoiceAssistant.simulateCommand('save nap timer');
        expect(onSaveTimer).toHaveBeenCalledWith('sleep');
        expect(lastSpoken).toBe('Saved Nap timer session.');

        VoiceAssistant.simulateCommand('reset nap timer');
        expect(onResetTimer).toHaveBeenCalledWith('sleep');
        expect(lastSpoken).toBe('Reset Nap timer.');

        // 4. Tummy Timer (all 4 actions)
        VoiceAssistant.simulateCommand('start tummy timer');
        expect(onStartTimer).toHaveBeenCalledWith('tummy');
        expect(lastSpoken).toBe('Started Tummy Time timer.');

        VoiceAssistant.simulateCommand('pause tummy timer');
        expect(onPauseTimer).toHaveBeenCalledWith('tummy');
        expect(lastSpoken).toBe('Paused Tummy Time timer.');

        VoiceAssistant.simulateCommand('save tummy timer');
        expect(onSaveTimer).toHaveBeenCalledWith('tummy');
        expect(lastSpoken).toBe('Saved Tummy Time timer session.');

        VoiceAssistant.simulateCommand('reset tummy timer');
        expect(onResetTimer).toHaveBeenCalledWith('tummy');
        expect(lastSpoken).toBe('Reset Tummy Time timer.');

        unsub();
    });

    it('recognizes colloquial phrasing and adversarial edge cases for all actions', () => {
        const onStartTimer = vi.fn();
        const onSaveTimer = vi.fn();
        const onLogDiaper = vi.fn();
        const onLogFeed = vi.fn();

        VoiceAssistant.init(
            {
                onLogFeed,
                onLogDiaper,
                onLogQuick: vi.fn(),
                onStartTimer,
                onPauseTimer: vi.fn(),
                onSaveTimer,
                onResetTimer: vi.fn(),
                onStatusQuery: vi.fn(),
                onError: vi.fn()
            },
            () => [],
            () => ({ name: 'Ian' } as any),
            () => ({ voiceTrigger: 'always' } as any)
        );

        // Colloquial sleep triggers
        VoiceAssistant.handleTranscript('baby fell asleep');
        expect(onStartTimer).toHaveBeenCalledWith('sleep');

        VoiceAssistant.handleTranscript('baby woke up');
        expect(onSaveTimer).toHaveBeenCalledWith('sleep');

        // Colloquial timer completions
        VoiceAssistant.handleTranscript('done feeding');
        expect(onSaveTimer).toHaveBeenCalledWith('feed');

        VoiceAssistant.handleTranscript('finished pumping');
        expect(onSaveTimer).toHaveBeenCalledWith('pump');

        VoiceAssistant.handleTranscript('done with tummy time');
        expect(onSaveTimer).toHaveBeenCalledWith('tummy');

        // Colloquial & adversarial diaper phrasing
        VoiceAssistant.handleTranscript('dirty diaper');
        expect(onLogDiaper).toHaveBeenCalledWith('poop');

        VoiceAssistant.handleTranscript('baby pooped');
        expect(onLogDiaper).toHaveBeenCalledWith('poop');

        VoiceAssistant.handleTranscript('baby peed');
        expect(onLogDiaper).toHaveBeenCalledWith('pee');

        VoiceAssistant.handleTranscript('wet and dirty');
        expect(onLogDiaper).toHaveBeenCalledWith('both');

        // Spoken number words conversion
        VoiceAssistant.handleTranscript('formula sixty ml');
        expect(onLogFeed).toHaveBeenCalledWith('formula', 60);

        VoiceAssistant.handleTranscript('formula two ounces');
        expect(onLogFeed).toHaveBeenCalledWith('formula', 59);

        // Nova & Hey Nova wake triggers
        VoiceAssistant.handleTranscript('Hey Nova 120 ml formula');
        expect(onLogFeed).toHaveBeenCalledWith('formula', 120);

        VoiceAssistant.handleTranscript('Nova wet diaper');
        expect(onLogDiaper).toHaveBeenCalledWith('pee');
    });

    describe('Device-Adaptive Voice Selection Engine', () => {
        const originalSpeechSynthesis = window.speechSynthesis;
        const originalUserAgent = navigator.userAgent;

        const setMockEnvironment = (ua: string, voices: any[]) => {
            Object.defineProperty(navigator, 'userAgent', {
                value: ua,
                configurable: true
            });
            Object.defineProperty(window, 'speechSynthesis', {
                value: {
                    getVoices: () => voices,
                    speak: vi.fn(),
                    cancel: vi.fn()
                },
                configurable: true
            });
        };

        beforeEach(() => {
            // Clear cached profile to re-trigger detection
            (VoiceAssistant as any).cachedVoiceProfile = null;
        });

        afterEach(() => {
            Object.defineProperty(navigator, 'userAgent', {
                value: originalUserAgent,
                configurable: true
            });
            Object.defineProperty(window, 'speechSynthesis', {
                value: originalSpeechSynthesis,
                configurable: true
            });
        });

        it('auto-detects and selects Apple Enhanced voice on iPhone with nursery prosody', () => {
            const mockVoices = [
                { name: 'Daniel (Compact)', lang: 'en-GB' },
                { name: 'Samantha (Enhanced)', lang: 'en-US' },
                { name: 'Fred', lang: 'en-US' }
            ];
            setMockEnvironment('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', mockVoices);

            const profile = VoiceAssistant.detectDeviceVoiceProfile();
            expect(profile.devicePlatform).toBe('ios');
            expect(profile.tier).toBe('enhanced');
            expect(profile.voice?.name).toBe('Samantha (Enhanced)');
            expect(profile.rate).toBe(0.94); // gentle soothing cadence
            expect(profile.pitch).toBe(1.02); // maternal lift
        });

        it('auto-detects Microsoft Jenny Online Natural on Windows Edge', () => {
            const mockVoices = [
                { name: 'Microsoft David - English (United States)', lang: 'en-US' },
                { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
                { name: 'Microsoft Jenny Online (Natural) - English (United States)', lang: 'en-US' }
            ];
            setMockEnvironment('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/122.0.0.0', mockVoices);

            const profile = VoiceAssistant.detectDeviceVoiceProfile();
            expect(profile.devicePlatform).toBe('windows');
            expect(profile.tier).toBe('neural-natural');
            expect(profile.voice?.name).toContain('Microsoft Jenny Online (Natural)');
            expect(profile.displayName).toContain('Microsoft Natural AI');
        });

        it('auto-detects Google US English on Windows Chrome to avoid robotic SAPI', () => {
            const mockVoices = [
                { name: 'Microsoft David - English (United States)', lang: 'en-US' },
                { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
                { name: 'Google US English', lang: 'en-US' }
            ];
            setMockEnvironment('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36', mockVoices);

            const profile = VoiceAssistant.detectDeviceVoiceProfile();
            expect(profile.devicePlatform).toBe('windows');
            expect(profile.voice?.name).toBe('Google US English');
            expect(profile.displayName).toBe('Google US English (High Clarity)');
        });

        it('applies acoustic softening to Windows SAPI Zira if no neural voices exist', () => {
            const mockVoices = [
                { name: 'Microsoft David - English (United States)', lang: 'en-US' },
                { name: 'Microsoft Zira - English (United States)', lang: 'en-US' }
            ];
            setMockEnvironment('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', mockVoices);

            const profile = VoiceAssistant.detectDeviceVoiceProfile();
            expect(profile.devicePlatform).toBe('windows');
            expect(profile.tier).toBe('softened-fallback');
            expect(profile.voice?.name).toContain('Zira');
            expect(profile.rate).toBe(0.92); // slower to prevent mechanical clipping
            expect(profile.pitch).toBe(0.96); // lower to eliminate nasal grating
        });

        it('auto-detects Google Speech Services on Android', () => {
            const mockVoices = [
                { name: 'en-us-x-sfg#female_1-local', lang: 'en-US' },
                { name: 'en-us-x-iom#male_1-local', lang: 'en-US' }
            ];
            setMockEnvironment('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36', mockVoices);

            const profile = VoiceAssistant.detectDeviceVoiceProfile();
            expect(profile.devicePlatform).toBe('android');
            expect(profile.voice?.name).toContain('female');
        });
    });

    describe('Voice Commands Sprint: Requirements 1 to 5', () => {
        let lastSpoken = '';
        let unsubSpeech: () => void;

        beforeEach(() => {
            lastSpoken = '';
            VoiceAssistant.resetConsecutiveFailures();
            VoiceAssistant.cancelPendingConfirmation();
            unsubSpeech = VoiceAssistant.onSpeech((t) => { lastSpoken = t; });
        });

        afterEach(() => {
            if (unsubSpeech) unsubSpeech();
            VoiceAssistant.cancelPendingConfirmation();
        });

        it('Requirement 1: strictly gates actions behind "Hey Nova" or "Nova" wake trigger', () => {
            const onStartTimer = vi.fn();
            const onLogDiaper = vi.fn();

            VoiceAssistant.init(
                {
                    onLogFeed: vi.fn(),
                    onLogDiaper,
                    onLogQuick: vi.fn(),
                    onStartTimer,
                    onPauseTimer: vi.fn(),
                    onSaveTimer: vi.fn(),
                    onResetTimer: vi.fn(),
                    onStatusQuery: vi.fn(),
                    onError: vi.fn()
                },
                () => [],
                () => ({ name: 'Nova' } as any),
                () => ({ voiceTrigger: 'hey nova' } as any)
            );

            // Ambient background room conversation WITHOUT "Nova" -> completely ignored
            VoiceAssistant.handleTranscript('start feed timer');
            expect(onStartTimer).not.toHaveBeenCalled();
            expect(lastSpoken).toBe('');
            expect(VoiceAssistant.getConsecutiveFailures()).toBe(0);

            VoiceAssistant.handleTranscript('dirty diaper');
            expect(onLogDiaper).not.toHaveBeenCalled();
            expect(lastSpoken).toBe('');

            // Command WITH "Hey Nova" -> successfully executed
            VoiceAssistant.handleTranscript('Hey Nova start feed timer');
            expect(onStartTimer).toHaveBeenCalledWith('feed');
            expect(lastSpoken).toBe('Started Feed timer.');

            // Command WITH "Nova" -> successfully executed
            VoiceAssistant.handleTranscript('Nova dirty diaper');
            expect(onLogDiaper).toHaveBeenCalledWith('poop');
            expect(lastSpoken).toBe('Logged Dirty Diaper.');
        });

        it('Requirement 2: supports Start, Resume, Pause, Stop, Save, and Reset for all 4 timers with verbal reporting', () => {
            const onStartTimer = vi.fn();
            const onPauseTimer = vi.fn();
            const onSaveTimer = vi.fn();
            const onResetTimer = vi.fn();

            VoiceAssistant.init(
                {
                    onLogFeed: vi.fn(),
                    onLogDiaper: vi.fn(),
                    onLogQuick: vi.fn(),
                    onStartTimer,
                    onPauseTimer,
                    onSaveTimer,
                    onResetTimer,
                    onStatusQuery: vi.fn(),
                    onError: vi.fn()
                },
                () => [],
                () => ({ name: 'Ian' } as any),
                () => ({ voiceTrigger: 'hey nova' } as any)
            );

            // 1. Feed Timer (Start, Resume, Pause, Stop, Save, Reset)
            VoiceAssistant.handleTranscript('Hey Nova start feed timer');
            expect(onStartTimer).toHaveBeenCalledWith('feed');
            expect(lastSpoken).toBe('Started Feed timer.');

            VoiceAssistant.handleTranscript('Hey Nova resume feed timer');
            expect(onStartTimer).toHaveBeenCalledWith('feed');
            expect(lastSpoken).toBe('Resumed Feed timer.');

            VoiceAssistant.handleTranscript('Hey Nova pause feed timer');
            expect(onPauseTimer).toHaveBeenCalledWith('feed');
            expect(lastSpoken).toBe('Paused Feed timer.');

            VoiceAssistant.handleTranscript('Hey Nova stop feed timer');
            expect(onPauseTimer).toHaveBeenCalledWith('feed');
            expect(lastSpoken).toBe('Stopped Feed timer.');

            VoiceAssistant.handleTranscript('Hey Nova save feed timer');
            expect(onSaveTimer).toHaveBeenCalledWith('feed');
            expect(lastSpoken).toBe('Saved Feed timer session.');

            VoiceAssistant.handleTranscript('Hey Nova reset feed timer');
            expect(onResetTimer).toHaveBeenCalledWith('feed');
            expect(lastSpoken).toBe('Reset Feed timer.');

            // 2. Pump Timer (Start, Resume, Pause, Stop, Save, Reset)
            VoiceAssistant.handleTranscript('Hey Nova start pump timer');
            expect(onStartTimer).toHaveBeenCalledWith('pump');
            expect(lastSpoken).toBe('Started Pump timer.');

            VoiceAssistant.handleTranscript('Hey Nova resume pump timer');
            expect(onStartTimer).toHaveBeenCalledWith('pump');
            expect(lastSpoken).toBe('Resumed Pump timer.');

            VoiceAssistant.handleTranscript('Hey Nova pause pump timer');
            expect(onPauseTimer).toHaveBeenCalledWith('pump');
            expect(lastSpoken).toBe('Paused Pump timer.');

            VoiceAssistant.handleTranscript('Hey Nova stop pump timer');
            expect(onPauseTimer).toHaveBeenCalledWith('pump');
            expect(lastSpoken).toBe('Stopped Pump timer.');

            VoiceAssistant.handleTranscript('Hey Nova save pump timer');
            expect(onSaveTimer).toHaveBeenCalledWith('pump');
            expect(lastSpoken).toBe('Saved Pump timer session.');

            VoiceAssistant.handleTranscript('Hey Nova reset pump timer');
            expect(onResetTimer).toHaveBeenCalledWith('pump');
            expect(lastSpoken).toBe('Reset Pump timer.');

            // 3. Nap Timer (Start, Resume, Pause, Stop, Save, Reset)
            VoiceAssistant.handleTranscript('Hey Nova start nap timer');
            expect(onStartTimer).toHaveBeenCalledWith('sleep');
            expect(lastSpoken).toBe('Started Nap timer.');

            VoiceAssistant.handleTranscript('Hey Nova resume nap timer');
            expect(onStartTimer).toHaveBeenCalledWith('sleep');
            expect(lastSpoken).toBe('Resumed Nap timer.');

            VoiceAssistant.handleTranscript('Hey Nova pause nap timer');
            expect(onPauseTimer).toHaveBeenCalledWith('sleep');
            expect(lastSpoken).toBe('Paused Nap timer.');

            VoiceAssistant.handleTranscript('Hey Nova stop nap timer');
            expect(onPauseTimer).toHaveBeenCalledWith('sleep');
            expect(lastSpoken).toBe('Stopped Nap timer.');

            VoiceAssistant.handleTranscript('Hey Nova save nap timer');
            expect(onSaveTimer).toHaveBeenCalledWith('sleep');
            expect(lastSpoken).toBe('Saved Nap timer session.');

            VoiceAssistant.handleTranscript('Hey Nova reset nap timer');
            expect(onResetTimer).toHaveBeenCalledWith('sleep');
            expect(lastSpoken).toBe('Reset Nap timer.');

            // 4. Tummy Time Timer (Start, Resume, Pause, Stop, Save, Reset)
            VoiceAssistant.handleTranscript('Hey Nova start tummy timer');
            expect(onStartTimer).toHaveBeenCalledWith('tummy');
            expect(lastSpoken).toBe('Started Tummy Time timer.');

            VoiceAssistant.handleTranscript('Hey Nova resume tummy timer');
            expect(onStartTimer).toHaveBeenCalledWith('tummy');
            expect(lastSpoken).toBe('Resumed Tummy Time timer.');

            VoiceAssistant.handleTranscript('Hey Nova pause tummy timer');
            expect(onPauseTimer).toHaveBeenCalledWith('tummy');
            expect(lastSpoken).toBe('Paused Tummy Time timer.');

            VoiceAssistant.handleTranscript('Hey Nova stop tummy timer');
            expect(onPauseTimer).toHaveBeenCalledWith('tummy');
            expect(lastSpoken).toBe('Stopped Tummy Time timer.');

            VoiceAssistant.handleTranscript('Hey Nova save tummy timer');
            expect(onSaveTimer).toHaveBeenCalledWith('tummy');
            expect(lastSpoken).toBe('Saved Tummy Time timer session.');

            VoiceAssistant.handleTranscript('Hey Nova reset tummy timer');
            expect(onResetTimer).toHaveBeenCalledWith('tummy');
            expect(lastSpoken).toBe('Reset Tummy Time timer.');
        });

        it('Requirement 3: adaptive failure retry counter and response messages', () => {
            const onError = vi.fn();
            VoiceAssistant.init(
                {
                    onLogFeed: vi.fn(),
                    onLogDiaper: vi.fn(),
                    onLogQuick: vi.fn(),
                    onStatusQuery: vi.fn(),
                    onError
                },
                () => [],
                () => ({ name: 'Ian' } as any),
                () => ({ voiceTrigger: 'hey nova' } as any)
            );

            // 1st unrecognized command
            VoiceAssistant.handleTranscript('Hey Nova, do something impossible');
            expect(lastSpoken).toBe("I didn't quite catch that, can you try again?");
            expect(VoiceAssistant.getConsecutiveFailures()).toBe(1);

            // 2nd unrecognized command
            VoiceAssistant.handleTranscript('Hey Nova, play music');
            expect(lastSpoken).toBe("I didn't quite catch that, can you try again?");
            expect(VoiceAssistant.getConsecutiveFailures()).toBe(2);

            // 3rd unrecognized command
            VoiceAssistant.handleTranscript('Hey Nova, check the stock market');
            expect(lastSpoken).toBe("I'm sorry, I don't understand that command. Try another one.");
            expect(VoiceAssistant.getConsecutiveFailures()).toBe(3);

            // 4th consecutive unrecognized command
            VoiceAssistant.handleTranscript('Hey Nova, another bad command');
            expect(lastSpoken).toBe("I'm sorry, I don't understand that command. Try another one.");
            expect(VoiceAssistant.getConsecutiveFailures()).toBe(4);

            // A successful command resets the failure counter to 0
            VoiceAssistant.handleTranscript('Hey Nova, logged wet diaper');
            expect(lastSpoken).toBe('Logged Wet Diaper.');
            expect(VoiceAssistant.getConsecutiveFailures()).toBe(0);

            // Next unrecognized command starts back at 1
            VoiceAssistant.handleTranscript('Hey Nova, make some coffee');
            expect(lastSpoken).toBe("I didn't quite catch that, can you try again?");
            expect(VoiceAssistant.getConsecutiveFailures()).toBe(1);
        });

        it('Requirement 4: summary command with fuzzy phrasing and correct template', () => {
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const mockLogs: ActivityLog[] = [
                {
                    id: '1',
                    category: 'feeding',
                    subType: 'formula',
                    amountMl: 120,
                    timestamp: Date.now() - 3600000,
                    dateStr: todayStr,
                    timeStr: '1:00 PM'
                } as ActivityLog,
                {
                    id: '2',
                    category: 'sleep',
                    durationMinutes: 90,
                    timestamp: Date.now() - 7200000,
                    dateStr: todayStr,
                    timeStr: '11:00 AM'
                } as ActivityLog,
                {
                    id: '3',
                    category: 'tummy',
                    durationMinutes: 15,
                    timestamp: Date.now() - 1800000,
                    dateStr: todayStr,
                    timeStr: '3:00 PM'
                } as ActivityLog
            ];

            VoiceAssistant.init(
                {
                    onLogFeed: vi.fn(),
                    onLogDiaper: vi.fn(),
                    onLogQuick: vi.fn(),
                    onStatusQuery: vi.fn(),
                    onError: vi.fn()
                },
                () => mockLogs,
                () => ({ name: 'Baby Ian' } as any),
                () => ({ voiceTrigger: 'hey nova' } as any)
            );

            // Variation A: "Hey Nova, give me a summary"
            VoiceAssistant.handleTranscript('Hey Nova, give me a summary');
            expect(lastSpoken).toBe('Baby Ian has had 120 mL of Milk today, napped for 1 hour 30 minutes, and had 15 minutes of Tummy Time.');

            // Variation B: "Nova, summary"
            VoiceAssistant.handleTranscript('Nova, summary');
            expect(lastSpoken).toBe('Baby Ian has had 120 mL of Milk today, napped for 1 hour 30 minutes, and had 15 minutes of Tummy Time.');

            // Variation C: "Hey Nova summary please"
            VoiceAssistant.handleTranscript('Hey Nova summary please');
            expect(lastSpoken).toBe('Baby Ian has had 120 mL of Milk today, napped for 1 hour 30 minutes, and had 15 minutes of Tummy Time.');
        });

        it('Requirement 5: undo command with interactive Yes/No confirmation', () => {
            const onUndoLastActivity = vi.fn();
            const onConfirmationRequested = vi.fn();

            const mockLogs: ActivityLog[] = [
                {
                    id: 'log_latest',
                    category: 'diaper',
                    subType: 'poop',
                    timestamp: Date.now(),
                    dateStr: '2026-10-18',
                    timeStr: '5:00 PM'
                } as ActivityLog
            ];

            VoiceAssistant.init(
                {
                    onLogFeed: vi.fn(),
                    onLogDiaper: vi.fn(),
                    onLogQuick: vi.fn(),
                    onUndoLastActivity,
                    onConfirmationRequested,
                    onStatusQuery: vi.fn(),
                    onError: vi.fn()
                },
                () => mockLogs,
                () => ({ name: 'Ian' } as any),
                () => ({ voiceTrigger: 'hey nova' } as any)
            );

            // Flow 1: User requests undo -> Nova asks confirmation question -> User says No (cancels)
            VoiceAssistant.handleTranscript('Hey Nova, undo last command');
            expect(lastSpoken).toBe('Would you like me to undo the last activity?');
            expect(onConfirmationRequested).toHaveBeenCalledWith('Would you like me to undo the last activity?');
            expect(VoiceAssistant.getPendingConfirmation()).not.toBeNull();
            expect(onUndoLastActivity).not.toHaveBeenCalled();

            VoiceAssistant.handleTranscript('No');
            expect(lastSpoken).toBe('Okay, canceled undo.');
            expect(VoiceAssistant.getPendingConfirmation()).toBeNull();
            expect(onUndoLastActivity).not.toHaveBeenCalled();

            // Flow 2: User requests undo -> Nova asks confirmation question -> User says Yes (executes)
            VoiceAssistant.handleTranscript('Nova undo last activity');
            expect(lastSpoken).toBe('Would you like me to undo the last activity?');
            expect(VoiceAssistant.getPendingConfirmation()).not.toBeNull();

            VoiceAssistant.handleTranscript('Yes');
            expect(onUndoLastActivity).toHaveBeenCalled();
            expect(lastSpoken).toBe('Undid the last activity.');
            expect(VoiceAssistant.getPendingConfirmation()).toBeNull();
        });
    });
});

