import { describe, it, expect } from 'vitest';
import { SOUND_TRACKS } from '../engines/soundMachine';

describe('Sound Tracks & Lullaby Nomenclature', () => {
    it('names the acoustic lullaby track as Piano Lullaby without Brahms references', () => {
        const chimes = SOUND_TRACKS.chimes;
        expect(chimes).toBeDefined();
        expect(chimes.name).toBe('Piano Lullaby');
        expect(chimes.icon).toBe('🎹');

        // Verify no mentions of Brahms in name or subtitle
        expect(chimes.name.toLowerCase()).not.toContain('brahm');
        expect(chimes.subtitle.toLowerCase()).not.toContain('brahm');
    });

    it('contains all 4 nursery soundscapes with soothing descriptions', () => {
        expect(SOUND_TRACKS.rain).toBeDefined();
        expect(SOUND_TRACKS.rain.name).toContain('Rain');

        expect(SOUND_TRACKS.waves).toBeDefined();
        expect(SOUND_TRACKS.waves.name).toContain('Waves');

        expect(SOUND_TRACKS.white).toBeDefined();
        expect(SOUND_TRACKS.white.name).toContain('Noise');

        expect(SOUND_TRACKS.chimes).toBeDefined();
    });
});
