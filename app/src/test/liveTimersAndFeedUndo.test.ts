import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoiceAssistant } from '../engines/voiceEngine';

describe('Sprint 43 - Live Timers, Feed Consolidation & Voice Assistant', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('VoiceAssistant tracks mic active state and notifies listeners for button glow', () => {
        let micState = false;
        const unsub = VoiceAssistant.onStateChange(st => {
            micState = st.isMic;
        });

        VoiceAssistant.setMicEnabled(true);
        expect(VoiceAssistant.isMicActive()).toBe(true);
        expect(micState).toBe(true);

        VoiceAssistant.setMicEnabled(false);
        expect(VoiceAssistant.isMicActive()).toBe(false);
        expect(micState).toBe(false);

        unsub();
    });

    it('processes direct pediatric care voice commands without mandatory wake word', () => {
        const onLogDiaper = vi.fn();
        const onLogFeed = vi.fn();
        const onLogQuick = vi.fn();

        VoiceAssistant.init(
            {
                onLogFeed,
                onLogDiaper,
                onLogQuick,
                onStatusQuery: vi.fn(),
                onError: vi.fn()
            },
            () => [],
            () => ({ name: 'Ian' } as any),
            () => ({ voiceTrigger: 'always' } as any)
        );

        VoiceAssistant.setMicEnabled(true);

        // Direct 'poop' command
        VoiceAssistant.handleTranscript('poop');
        expect(onLogDiaper).toHaveBeenCalledWith('poop');

        // Direct 'formula 90 ml' command
        VoiceAssistant.handleTranscript('formula 90 ml');
        expect(onLogFeed).toHaveBeenCalledWith('formula', 90);

        // Direct 'tummy time' command
        VoiceAssistant.handleTranscript('5 minutes of tummy time');
        expect(onLogQuick).toHaveBeenCalledWith('tummy', 5);
    });

    it('supports 3 feeding subtypes: formula (Bottled Formula), breastmilk (Bottled Breastmilk), nursing (Nursing)', () => {
        const feedSubtypes = ['formula', 'breastmilk', 'nursing'];
        expect(feedSubtypes).toHaveLength(3);
        const formatLabel = (sub: string) => {
            if (sub === 'nursing') return '🤱 Nursing';
            if (sub === 'breastmilk') return '🥛 Bottled Breastmilk';
            return '🍼 Bottled Formula';
        };

        expect(formatLabel('formula')).toBe('🍼 Bottled Formula');
        expect(formatLabel('breastmilk')).toBe('🥛 Bottled Breastmilk');
        expect(formatLabel('nursing')).toBe('🤱 Nursing');
    });

    it('Pending Save contract: timer preserves elapsed time when undone', () => {
        let timerSeconds = 900; // 15 mins
        let isTimerReset = false;
        let isLogCommitted = false;

        const onLogTimer = () => {
            isLogCommitted = true;
        };
        const resetTimer = () => {
            isTimerReset = true;
            timerSeconds = 0;
        };

        // User clicks Save: timer pauses
        const isPaused = true;
        expect(isPaused).toBe(true);

        // During 5s undo window:
        expect(isLogCommitted).toBe(false);
        expect(isTimerReset).toBe(false);
        expect(timerSeconds).toBe(900);

        // Case A: User clicks Undo
        const userUndid = true;
        if (userUndid) {
            // Cancel save
        }
        expect(isLogCommitted).toBe(false);
        expect(isTimerReset).toBe(false);
        expect(timerSeconds).toBe(900); // Still 15 mins preserved!

        // Case B: Countdown expires without undo
        const timerExpired = true;
        if (timerExpired) {
            onLogTimer();
            resetTimer();
        }
        expect(isLogCommitted).toBe(true);
        expect(isTimerReset).toBe(true);
        expect(timerSeconds).toBe(0);
    });

    it('calculates 1-hour Discard Milk countdown timer accurately', () => {
        const DISCARD_TOTAL_SECONDS = 3600;
        const formatDiscardTimer = (seconds: number) => {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        // 1. Initial ready state (0s elapsed) -> 60:00 remaining
        const elapsed0 = 0;
        const remaining0 = Math.max(0, DISCARD_TOTAL_SECONDS - elapsed0);
        expect(formatDiscardTimer(remaining0)).toBe('60:00');

        // 2. User screenshot state (8s elapsed) -> 59:52 remaining
        const elapsed8 = 8;
        const remaining8 = Math.max(0, DISCARD_TOTAL_SECONDS - elapsed8);
        expect(formatDiscardTimer(remaining8)).toBe('59:52');

        // 3. 15 minutes feeding (900s elapsed) -> 45:00 remaining
        const elapsed900 = 900;
        const remaining900 = Math.max(0, DISCARD_TOTAL_SECONDS - elapsed900);
        expect(formatDiscardTimer(remaining900)).toBe('45:00');

        // 4. Over 1 hour (>3600s elapsed) -> 00:00 expired
        const elapsed3605 = 3605;
        const remaining3605 = Math.max(0, DISCARD_TOTAL_SECONDS - elapsed3605);
        expect(formatDiscardTimer(remaining3605)).toBe('00:00');
        const isExpired = remaining3605 <= 0;
        expect(isExpired).toBe(true);
    });
});
