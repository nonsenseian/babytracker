// Built-In Nursery Sound Machine & Custom Audio Recorder Engine
// High-realism Web Audio synthesis: Gentle Rain with Audible Raindrops & Rolling Thunder,
// Ocean Waves Ebbing, Flowing, and Crashing, Flowing Acoustic Piano Lullaby,
// Pink Noise, Continuous Infinite Loop (∞), and IndexedDB Custom Voice Recording Studio.

export const PIANO_FREQS: Record<string, number> = {
    'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47, 'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
    'G3': 196.00, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
    'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46
};

// Brahms' Lullaby (Wiegenlied, Op. 49, No. 4) in C Major - 80 BPM
// Strict chronological sequence without measure gaps (M1 through M17)
export const C_MAJOR_LULLABY_SEQUENCE: Array<{ n: string; d: number; v?: number }> = [
    // M1: E4,Q | E4,Q | G4,DQ
    { n: 'E4', d: 1.0 }, { n: 'E4', d: 1.0 }, { n: 'G4', d: 1.5 },
    // M2: E4,E | E4,Q | G4,H
    { n: 'E4', d: 0.5 }, { n: 'E4', d: 1.0 }, { n: 'G4', d: 2.0 },
    // M3: E4,Q | G4,Q | C5,DQ
    { n: 'E4', d: 1.0 }, { n: 'G4', d: 1.0 }, { n: 'C5', d: 1.5 },
    // M4: B4,E | A4,Q | A4,Q
    { n: 'B4', d: 0.5 }, { n: 'A4', d: 1.0 }, { n: 'A4', d: 1.0 },
    // M5: G4,H | D4,Q | E4,Q
    { n: 'G4', d: 2.0 }, { n: 'D4', d: 1.0 }, { n: 'E4', d: 1.0 },
    // M6: F4,DQ | D4,E
    { n: 'F4', d: 1.5 }, { n: 'D4', d: 0.5 },
    // M7: E4,Q | F4,H | D4,Q
    { n: 'E4', d: 1.0 }, { n: 'F4', d: 2.0 }, { n: 'D4', d: 1.0 },
    // M8: F4,Q | B4,DQ
    { n: 'F4', d: 1.0 }, { n: 'B4', d: 1.5 },
    // M9: A4,E | G4,Q | B4,Q
    { n: 'A4', d: 0.5 }, { n: 'G4', d: 1.0 }, { n: 'B4', d: 1.0 },
    // M10: C5,H | C4,Q | C4,Q
    { n: 'C5', d: 2.0 }, { n: 'C4', d: 1.0 }, { n: 'C4', d: 1.0 },
    // M11: C5,DH
    { n: 'C5', d: 3.0 },
    // M12: A4,Q | F4,Q | G4,DH
    { n: 'A4', d: 1.0 }, { n: 'F4', d: 1.0 }, { n: 'G4', d: 3.0 },
    // M13: E4,Q | C4,Q | F4,Q
    { n: 'E4', d: 1.0 }, { n: 'C4', d: 1.0 }, { n: 'F4', d: 1.0 },
    // M14: G4,Q | E4,Q | C4,Q
    { n: 'G4', d: 1.0 }, { n: 'E4', d: 1.0 }, { n: 'C4', d: 1.0 },
    // M15: C4,Q | C5,DH
    { n: 'C4', d: 1.0 }, { n: 'C5', d: 3.0 },
    // M16: A4,Q | F4,Q | G4,DH
    { n: 'A4', d: 1.0 }, { n: 'F4', d: 1.0 }, { n: 'G4', d: 3.0 },
    // M17: D4,Q | E4,Q | C4,H
    { n: 'D4', d: 1.0 }, { n: 'E4', d: 1.0 }, { n: 'C4', d: 2.0 }
];


export interface PianoNoteEvent {
    n: string; // Note name (e.g. 'F4', 'C5')
    b: number; // Beat offset within 3/4 measure (0.0 to 2.9)
    d: number; // Duration in beats
    v: number; // Touch velocity (0.08 to 0.28)
}

export interface PianoMeasure {
    rh: PianoNoteEvent[]; // Right hand singing melody
    lh: PianoNoteEvent[]; // Left hand gentle rocking accompaniment
}

// 24-Measure Full Two-Hand Arrangement in F Major (3/4 time, tranquil rocking cradle tempo)
// Replicating the warm, flowing acoustic piano performance with undulating broken arpeggios & singing melody
export const PIANO_LULLABY_MEASURES: PianoMeasure[] = [
    // Meas 0 (Pickup):
    {
        rh: [
            { n: 'C4', b: 2.0, d: 0.9, v: 0.18 },
            { n: 'C4', b: 2.5, d: 0.9, v: 0.20 }
        ],
        lh: []
    },
    // Meas 1: A4 (dotted half) | LH: F2 -> C3 -> A3 (flowing arpeggio)
    {
        rh: [
            { n: 'A4', b: 0, d: 2.8, v: 0.24 },
            { n: 'C4', b: 2.0, d: 0.9, v: 0.17 },
            { n: 'C4', b: 2.5, d: 0.9, v: 0.19 }
        ],
        lh: [
            { n: 'F2', b: 0, d: 3.5, v: 0.16 },
            { n: 'C3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'A3', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 2: A4 (dotted half) | LH: F2 -> C3 -> A3
    {
        rh: [
            { n: 'A4', b: 0, d: 2.8, v: 0.24 },
            { n: 'C4', b: 2.0, d: 0.9, v: 0.17 },
            { n: 'A4', b: 2.5, d: 0.9, v: 0.21 }
        ],
        lh: [
            { n: 'F2', b: 0, d: 3.5, v: 0.16 },
            { n: 'C3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'A3', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 3: F5 (half), E5 (quarter) | LH: F2 -> C3 -> A3
    {
        rh: [
            { n: 'F5', b: 0, d: 1.8, v: 0.26 },
            { n: 'E5', b: 2.0, d: 1.0, v: 0.21 }
        ],
        lh: [
            { n: 'F2', b: 0, d: 3.5, v: 0.16 },
            { n: 'C3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'A3', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 4: D5 (half), D5 (quarter) | LH: Bb2 -> F3 -> D4
    {
        rh: [
            { n: 'D5', b: 0, d: 1.8, v: 0.24 },
            { n: 'D5', b: 2.0, d: 1.0, v: 0.20 }
        ],
        lh: [
            { n: 'Bb2', b: 0, d: 3.5, v: 0.16 },
            { n: 'F3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'D4', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 5: C5 (dotted half) | LH: F2 -> C3 -> A3
    {
        rh: [
            { n: 'C5', b: 0, d: 2.8, v: 0.23 },
            { n: 'G3', b: 2.0, d: 0.9, v: 0.15 },
            { n: 'A3', b: 2.5, d: 0.9, v: 0.17 }
        ],
        lh: [
            { n: 'F2', b: 0, d: 3.5, v: 0.16 },
            { n: 'C3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'A3', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 6: G4 (half), E4 (quarter) | LH: C3 -> G3 -> E4
    {
        rh: [
            { n: 'G4', b: 0, d: 1.8, v: 0.23 },
            { n: 'E4', b: 2.0, d: 1.0, v: 0.19 }
        ],
        lh: [
            { n: 'C3', b: 0, d: 3.5, v: 0.15 },
            { n: 'G3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'E4', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 7: G4 (half) + pickup | LH: C3 -> G3 -> E4
    {
        rh: [
            { n: 'G4', b: 0, d: 1.8, v: 0.22 },
            { n: 'G3', b: 2.0, d: 0.9, v: 0.15 },
            { n: 'A3', b: 2.5, d: 0.9, v: 0.17 }
        ],
        lh: [
            { n: 'C3', b: 0, d: 3.5, v: 0.15 },
            { n: 'G3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'E4', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 8: G4 (half), E4 (quarter) + pickup
    {
        rh: [
            { n: 'G4', b: 0, d: 1.8, v: 0.23 },
            { n: 'E4', b: 2.0, d: 0.9, v: 0.18 },
            { n: 'G3', b: 2.0, d: 0.9, v: 0.15 },
            { n: 'Bb3', b: 2.5, d: 0.9, v: 0.17 }
        ],
        lh: [
            { n: 'C3', b: 0, d: 3.5, v: 0.15 },
            { n: 'G3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'E4', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 9: E5 (half), D5 (quarter) | LH: C3 -> G3 -> E4
    {
        rh: [
            { n: 'E5', b: 0, d: 1.8, v: 0.25 },
            { n: 'D5', b: 2.0, d: 1.0, v: 0.21 }
        ],
        lh: [
            { n: 'C3', b: 0, d: 3.5, v: 0.15 },
            { n: 'G3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'E4', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 10: C5 (half), E5 (quarter) | LH: C3 -> G3 -> E4
    {
        rh: [
            { n: 'C5', b: 0, d: 1.8, v: 0.23 },
            { n: 'E5', b: 2.0, d: 1.0, v: 0.22 }
        ],
        lh: [
            { n: 'C3', b: 0, d: 3.5, v: 0.15 },
            { n: 'G3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'E4', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 11: F5 (dotted half) | LH: F2 -> C3 -> A3
    {
        rh: [
            { n: 'F5', b: 0, d: 2.8, v: 0.26 },
            { n: 'F4', b: 2.0, d: 0.9, v: 0.17 },
            { n: 'F4', b: 2.5, d: 0.9, v: 0.19 }
        ],
        lh: [
            { n: 'F2', b: 0, d: 3.5, v: 0.16 },
            { n: 'C3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'A3', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Section B ("Guten Abend, gut' Nacht..."):
    // Meas 12: F5 (half), D5 (quarter) | LH: Bb2 -> F3 -> D4
    {
        rh: [
            { n: 'F5', b: 0, d: 1.8, v: 0.26 },
            { n: 'D5', b: 2.0, d: 1.0, v: 0.21 }
        ],
        lh: [
            { n: 'Bb2', b: 0, d: 3.5, v: 0.16 },
            { n: 'F3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'D4', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 13: Bb4 (half), C5 (quarter) | LH: Bb2 -> F3 -> D4
    {
        rh: [
            { n: 'Bb4', b: 0, d: 1.8, v: 0.23 },
            { n: 'C5', b: 2.0, d: 1.0, v: 0.22 }
        ],
        lh: [
            { n: 'Bb2', b: 0, d: 3.5, v: 0.16 },
            { n: 'F3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'D4', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 14: D5 (dotted half) | LH: Bb2 -> F3 -> D4
    {
        rh: [
            { n: 'D5', b: 0, d: 2.8, v: 0.25 },
            { n: 'C5', b: 2.0, d: 0.9, v: 0.17 },
            { n: 'Bb4', b: 2.5, d: 0.9, v: 0.18 }
        ],
        lh: [
            { n: 'Bb2', b: 0, d: 3.5, v: 0.16 },
            { n: 'F3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'D4', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 15: A4 (half), F4 (quarter) | LH: F2 -> C3 -> A3
    {
        rh: [
            { n: 'A4', b: 0, d: 1.8, v: 0.24 },
            { n: 'F4', b: 2.0, d: 1.0, v: 0.19 }
        ],
        lh: [
            { n: 'F2', b: 0, d: 3.5, v: 0.16 },
            { n: 'C3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'A3', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 16: A4 (half), Bb4 (quarter) | LH: F2 -> C3 -> A3
    {
        rh: [
            { n: 'A4', b: 0, d: 1.8, v: 0.23 },
            { n: 'Bb4', b: 2.0, d: 1.0, v: 0.21 }
        ],
        lh: [
            { n: 'F2', b: 0, d: 3.5, v: 0.16 },
            { n: 'C3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'A3', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 17: C5 (dotted half) | LH: F2 -> C3 -> A3
    {
        rh: [
            { n: 'C5', b: 0, d: 2.8, v: 0.24 },
            { n: 'F4', b: 2.0, d: 0.9, v: 0.16 },
            { n: 'F4', b: 2.5, d: 0.9, v: 0.18 }
        ],
        lh: [
            { n: 'F2', b: 0, d: 3.5, v: 0.16 },
            { n: 'C3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'A3', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 18: F5 (half), D5 (quarter) | LH: Bb2 -> F3 -> D4
    {
        rh: [
            { n: 'F5', b: 0, d: 1.8, v: 0.26 },
            { n: 'D5', b: 2.0, d: 1.0, v: 0.21 }
        ],
        lh: [
            { n: 'Bb2', b: 0, d: 3.5, v: 0.16 },
            { n: 'F3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'D4', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 19: Bb4 (half), C5 (quarter) | LH: Bb2 -> F3 -> D4
    {
        rh: [
            { n: 'Bb4', b: 0, d: 1.8, v: 0.23 },
            { n: 'C5', b: 2.0, d: 1.0, v: 0.22 }
        ],
        lh: [
            { n: 'Bb2', b: 0, d: 3.5, v: 0.16 },
            { n: 'F3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'D4', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 20: D5 (dotted half) | LH: Bb2 -> F3 -> D4
    {
        rh: [
            { n: 'D5', b: 0, d: 2.8, v: 0.24 },
            { n: 'C5', b: 2.0, d: 0.9, v: 0.17 },
            { n: 'Bb4', b: 2.5, d: 0.9, v: 0.18 }
        ],
        lh: [
            { n: 'Bb2', b: 0, d: 3.5, v: 0.16 },
            { n: 'F3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'D4', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 21: A4 (half), F4 (quarter) | LH: F2 -> C3 -> A3
    {
        rh: [
            { n: 'A4', b: 0, d: 1.8, v: 0.23 },
            { n: 'F4', b: 2.0, d: 1.0, v: 0.19 }
        ],
        lh: [
            { n: 'F2', b: 0, d: 3.5, v: 0.16 },
            { n: 'C3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'A3', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 22: G4 (half), C5 (quarter) | LH: C3 -> G3 -> E4
    {
        rh: [
            { n: 'G4', b: 0, d: 1.8, v: 0.22 },
            { n: 'C5', b: 2.0, d: 1.0, v: 0.21 }
        ],
        lh: [
            { n: 'C3', b: 0, d: 3.5, v: 0.15 },
            { n: 'G3', b: 1.0, d: 2.5, v: 0.08 },
            { n: 'E4', b: 2.0, d: 2.0, v: 0.07 }
        ]
    },
    // Meas 23: F4 (dotted half) - peaceful resolving arpeggio outro
    {
        rh: [
            { n: 'F4', b: 0, d: 4.0, v: 0.22 }
        ],
        lh: [
            { n: 'F2', b: 0, d: 4.5, v: 0.16 },
            { n: 'C3', b: 0.6, d: 3.8, v: 0.10 },
            { n: 'F3', b: 1.2, d: 3.2, v: 0.08 },
            { n: 'A3', b: 1.8, d: 2.8, v: 0.07 },
            { n: 'C4', b: 2.4, d: 2.4, v: 0.06 }
        ]
    }
];

// Legacy notes preserved for backwards compatibility
export const PIANO_LULLABY_NOTES = [
    { f: 392.00, d: 0.75 }, { f: 392.00, d: 0.75 }, { f: 493.88, d: 1.50 }
];
export const BRAHMS_NOTES = PIANO_LULLABY_NOTES;

export type SoundType = 'rain' | 'waves' | 'chimes' | 'white';

export interface SoundTrackInfo {
    id: SoundType;
    name: string;
    icon: string;
    subtitle: string;
    color: string;
}

export const SOUND_TRACKS: Record<SoundType, SoundTrackInfo> = {
    rain: {
        id: 'rain',
        name: 'Gentle Rain & Thunder',
        icon: '🌧️',
        subtitle: 'Audible Raindrops • Distant Rolling Thunder • Cozy Night',
        color: '#0284c7'
    },
    waves: {
        id: 'waves',
        name: 'Ocean Waves & Surf',
        icon: '🌊',
        subtitle: 'Rhythmic Swell, Crest & Crash • Foaming Surf • Receding Ebb',
        color: '#0d9488'
    },
    chimes: {
        id: 'chimes',
        name: 'Piano Lullaby',
        icon: '🎹',
        subtitle: 'Gentle Acoustic Piano • Flowing Harmonies • Seamless Loop',
        color: '#f59e0b'
    },
    white: {
        id: 'white',
        name: 'Womb-Like Calming Noise',
        icon: '📻',
        subtitle: 'Soothing Pink Noise • Lowpass Filtered • Constant Hush',
        color: '#8b5cf6'
    }
};

class BuiltInSoundEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private currentSound: SoundType | null = null;
    private volume: number = 0.8;
    private timerId: number | null = null;
    private activeNodes: AudioNode[] = [];
    private rainDropInterval: number | null = null;
    private thunderTimeout: number | null = null;
    private waveCycleInterval: number | null = null;
    private lullabyTimeouts: number[] = [];
    private pianoReverb: GainNode | null = null;

    private initContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioCtx();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public isPlaying(): boolean {
        return this.currentSound !== null;
    }

    public getActiveSound(): SoundType | null {
        return this.currentSound;
    }

    public getVolume(): number {
        return this.volume;
    }

    public setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    public stop() {
        if (this.rainDropInterval) {
            window.clearInterval(this.rainDropInterval);
            this.rainDropInterval = null;
        }
        if (this.thunderTimeout) {
            window.clearTimeout(this.thunderTimeout);
            this.thunderTimeout = null;
        }
        if (this.waveCycleInterval) {
            window.clearInterval(this.waveCycleInterval);
            this.waveCycleInterval = null;
        }
        this.lullabyTimeouts.forEach(id => window.clearTimeout(id));
        this.lullabyTimeouts = [];
        if (this.pianoReverb) {
            try {
                this.pianoReverb.disconnect();
            } catch (e) {}
            this.pianoReverb = null;
        }
        if (this.timerId) {
            window.clearTimeout(this.timerId);
            this.timerId = null;
        }

        this.activeNodes.forEach(node => {
            try {
                if ('stop' in node && typeof (node as any).stop === 'function') {
                    (node as any).stop();
                }
                node.disconnect();
            } catch (e) {}
        });
        this.activeNodes = [];
        this.currentSound = null;
    }

    public play(sound: SoundType, volume: number = 0.8, durationMinutes: number = 0) {
        this.stop();
        this.initContext();
        if (!this.ctx || !this.masterGain) return;

        this.currentSound = sound;
        this.setVolume(volume);

        if (sound === 'rain') {
            this.startGentleRainWithThunderAndDrops();
        } else if (sound === 'waves') {
            this.startOceanWavesCrashAndEbb();
        } else if (sound === 'chimes') {
            this.startPianoLullaby();
        } else if (sound === 'white') {
            this.startSoothingWombNoise();
        }

        // durationMinutes === 0 means Continuous Infinite Loop (∞)
        if (durationMinutes && durationMinutes > 0) {
            this.timerId = window.setTimeout(() => {
                this.stop();
            }, durationMinutes * 60 * 1000);
        }
    }

    // ==================== 1. GENTLE RAIN & AUDIBLE DROPS & ROLLING THUNDER ====================
    private startGentleRainWithThunderAndDrops() {
        if (!this.ctx || !this.masterGain) return;
        const sr = this.ctx.sampleRate;
        const bufferLen = sr * 4;
        const buffer = this.ctx.createBuffer(2, bufferLen, sr);

        // Generate stereo continuous pink rain bed
        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < bufferLen; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.075;
            }
        }

        const rainSource = this.ctx.createBufferSource();
        rainSource.buffer = buffer;
        rainSource.loop = true;

        const rainFilter = this.ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.value = 1800;

        rainSource.connect(rainFilter);
        rainFilter.connect(this.masterGain);
        rainSource.start(0);
        this.activeNodes.push(rainSource, rainFilter);

        // Audible Raindrops: procedural acoustic water drops pattering like a rainy night
        const spawnRaindrops = () => {
            if (this.currentSound !== 'rain' || !this.ctx || !this.masterGain) return;
            const now = this.ctx.currentTime;
            const dropCount = 1 + Math.floor(Math.random() * 2); // 1-2 droplets per tick
            for (let d = 0; d < dropCount; d++) {
                const delay = Math.random() * 0.08;
                const t = now + delay;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                // Droplet frequencies between 1300Hz and 2600Hz with downward micro-pitch inflection
                const baseFreq = 1350 + Math.random() * 1150;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(baseFreq, t);
                osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.82, t + 0.04);

                // Very quick attack and decay (percussive plink)
                const dropVol = 0.025 + Math.random() * 0.045;
                gain.gain.setValueAtTime(0.0001, t);
                gain.gain.linearRampToValueAtTime(dropVol, t + 0.004);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(t);
                osc.stop(t + 0.05);
            }
        };
        // Raindrops schedule every 90ms with natural variation
        this.rainDropInterval = window.setInterval(spawnRaindrops, 90);

        // Soft distant rolling thunder scheduler (every 16-24 seconds)
        const scheduleThunder = () => {
            if (this.currentSound !== 'rain' || !this.ctx) return;
            this.playSoftThunderRoll();
            const delay = 16000 + Math.random() * 9000;
            this.thunderTimeout = window.setTimeout(scheduleThunder, delay);
        };
        this.thunderTimeout = window.setTimeout(scheduleThunder, 3500);
    }

    private playSoftThunderRoll() {
        if (!this.ctx || !this.masterGain || this.currentSound !== 'rain') return;
        const t = this.ctx.currentTime;

        // Sub-bass rumble oscillator
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(54, t);
        osc.frequency.exponentialRampToValueAtTime(36, t + 5.5);

        // Thunder envelope: rises smoothly, rumbles, slowly fades into distance
        const thunderGain = this.ctx.createGain();
        thunderGain.gain.setValueAtTime(0.0001, t);
        thunderGain.gain.linearRampToValueAtTime(0.19, t + 1.2);
        // Secondary soft rumble surge at t+2.4s
        thunderGain.gain.setValueAtTime(0.18, t + 2.0);
        thunderGain.gain.linearRampToValueAtTime(0.14, t + 2.6);
        thunderGain.gain.exponentialRampToValueAtTime(0.0001, t + 6.0);

        const lpf = this.ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(130, t);
        lpf.frequency.exponentialRampToValueAtTime(75, t + 5.5);

        osc.connect(lpf);
        lpf.connect(thunderGain);
        thunderGain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 6.2);
    }

    // ==================== 2. OCEAN WAVES EBBING, FLOWING, AND CRASHING ====================
    private startOceanWavesCrashAndEbb() {
        if (!this.ctx || !this.masterGain) return;
        const sr = this.ctx.sampleRate;
        const bufferLen = sr * 4;
        const buffer = this.ctx.createBuffer(2, bufferLen, sr);

        // Generate ocean pink noise buffer
        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < bufferLen; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.15;
            }
        }

        const waveSource = this.ctx.createBufferSource();
        waveSource.buffer = buffer;
        waveSource.loop = true;

        const waveFilter = this.ctx.createBiquadFilter();
        waveFilter.type = 'lowpass';
        waveFilter.frequency.value = 220;

        const waveGain = this.ctx.createGain();
        waveGain.gain.value = 0.06;

        waveSource.connect(waveFilter);
        waveFilter.connect(waveGain);
        waveGain.connect(this.masterGain);
        waveSource.start(0);
        this.activeNodes.push(waveSource, waveFilter, waveGain);

        // Schedule realistic swell, crash, and ebb cycle (11.5 seconds per wave)
        const runWaveCycle = () => {
            if (this.currentSound !== 'waves' || !this.ctx) return;
            const now = this.ctx.currentTime;

            // Phase 1: Swell & Flow (0 to 4.2s) - Deep water moving toward shore
            waveFilter.frequency.cancelScheduledValues(now);
            waveGain.gain.cancelScheduledValues(now);

            waveFilter.frequency.setValueAtTime(220, now);
            waveFilter.frequency.exponentialRampToValueAtTime(680, now + 4.2);
            waveGain.gain.setValueAtTime(0.06, now);
            waveGain.gain.linearRampToValueAtTime(0.48, now + 4.2);

            // Phase 2: Crest & Crash (4.2s to 5.6s) - Wave breaks into foamy surf
            waveFilter.frequency.exponentialRampToValueAtTime(2100, now + 5.0);
            waveGain.gain.linearRampToValueAtTime(0.85, now + 5.0);

            // Phase 3: Recede & Ebb (5.6s to 10.2s) - Water rolls back over the sand
            waveFilter.frequency.exponentialRampToValueAtTime(200, now + 10.2);
            waveGain.gain.linearRampToValueAtTime(0.05, now + 10.2);

            // Phase 4: Brief peaceful lull between sets (10.2s to 11.5s)
        };

        // Trigger first cycle immediately and repeat continuously
        runWaveCycle();
        this.waveCycleInterval = window.setInterval(runWaveCycle, 11500);
    }

    // ==================== 3. FLOWING ACOUSTIC PIANO LULLABY ====================
    // Replicating a real acoustic piano performance: rich trichord unisons with micro-detuning,
    // felt hammer impact transient, wooden soundboard resonance, warm nursery room convolution reverb,
    // and flowing 3/4 waltz accompaniment (bass note on beat 1, soft harmony chords on beats 2 & 3).
    private getPianoReverb(): GainNode | null {
        if (this.pianoReverb) return this.pianoReverb;
        if (!this.ctx || !this.masterGain) return null;

        const rate = this.ctx.sampleRate;
        const len = Math.floor(rate * 1.5);
        const imp = this.ctx.createBuffer(2, len, rate);
        for (let c = 0; c < 2; c++) {
            const d = imp.getChannelData(c);
            for (let i = 0; i < len; i++) {
                d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (rate * 0.45));
            }
        }

        const convolver = this.ctx.createConvolver();
        convolver.buffer = imp;

        const wetGain = this.ctx.createGain();
        wetGain.gain.value = 0.25;
        convolver.connect(wetGain);
        wetGain.connect(this.masterGain);
        this.activeNodes.push(convolver, wetGain);
        this.pianoReverb = wetGain;
        return wetGain;
    }

    private playLivePianoKey(freq: number, durSec: number, startTime: number, velocity: number = 0.24) {
        if (!this.ctx || !this.masterGain || this.currentSound !== 'chimes') return;

        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0.0001, startTime);
        noteGain.gain.linearRampToValueAtTime(velocity, startTime + 0.015);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durSec * 1.3);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, startTime);

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.masterGain);

        const rev = this.getPianoReverb();
        if (rev) {
            noteGain.connect(rev);
        }

        osc.start(startTime);
        osc.stop(startTime + durSec * 1.35);
        this.activeNodes.push(osc, filter, noteGain);
    }

    private startPianoLullaby() {
        if (!this.ctx || !this.masterGain) return;
        this.getPianoReverb();

        // 80 BPM (0.75s per quarter note)
        const BEAT = 60.0 / 80.0;

        const schedulePass = (startAudioTime: number) => {
            if (this.currentSound !== 'chimes' || !this.ctx) return;
            let curTime = startAudioTime;

            C_MAJOR_LULLABY_SEQUENCE.forEach(ev => {
                const freq = PIANO_FREQS[ev.n];
                const durSec = ev.d * BEAT;
                if (freq) {
                    this.playLivePianoKey(freq, durSec, curTime, 0.24);
                }
                curTime += durSec;
            });

            // Loop seamlessly before the final note reverberation finishes
            const totalSecs = curTime - startAudioTime;
            const timerMs = Math.max(100, (totalSecs - 0.25) * 1000);
            const tid = window.setTimeout(() => {
                schedulePass(curTime);
            }, timerMs);
            this.lullabyTimeouts.push(tid);
        };

        schedulePass(this.ctx.currentTime + 0.05);
    }


    // ==================== 4. WOMB-LIKE CALMING NOISE ====================
    private startSoothingWombNoise() {
        if (!this.ctx || !this.masterGain) return;
        const sr = this.ctx.sampleRate;
        const bufferLen = sr * 3;
        const buffer = this.ctx.createBuffer(2, bufferLen, sr);

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < bufferLen; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
            }
        }

        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 750; // soft soothing womb profile

        src.connect(filter);
        filter.connect(this.masterGain);
        src.start(0);
        this.activeNodes.push(src, filter);
    }

    public playChime(type: 'wake' | 'success' | 'error' | 'reminder' = 'reminder') {
        try {
            this.initContext();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            if (type === 'wake') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.start(now);
                osc.stop(now + 0.28);
            } else if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(659.25, now);
                osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.14);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'error') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.linearRampToValueAtTime(349.23, now + 0.2);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'reminder') {
                // Gentle chime ding-dong for reminders
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.setValueAtTime(880.0, now + 0.15); // A5
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.08, now + 0.14);
                gain.gain.linearRampToValueAtTime(0.25, now + 0.16);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
                osc.start(now);
                osc.stop(now + 0.7);
            }
        } catch (e) {
            console.warn('playChime error:', e);
        }
    }
}

// ==================== CUSTOM AUDIO RECORDING STUDIO (INDEXEDDB) ====================
class CustomAudioRecorderEngine {
    private db: IDBDatabase | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private audioObjectUrl: string | null = null;
    private audioElement: HTMLAudioElement | null = null;
    private isRecording: boolean = false;
    private isPlaying: boolean = false;
    private isInfiniteLoop: boolean = true;
    private volume: number = 0.8;

    public async init(): Promise<void> {
        return new Promise((resolve) => {
            const req = indexedDB.open('novababy_db', 1);
            req.onupgradeneeded = (e: any) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('custom_audio')) {
                    db.createObjectStore('custom_audio', { keyPath: 'id' });
                }
            };
            req.onsuccess = (e: any) => {
                this.db = e.target.result;
                resolve();
            };
            req.onerror = () => {
                resolve();
            };
        });
    }

    public async saveRecording(blob: Blob): Promise<void> {
        if (!this.db) await this.init();
        if (!this.db) return;
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction('custom_audio', 'readwrite');
            const store = tx.objectStore('custom_audio');
            const putReq = store.put({ id: 'primary_voice_memo', blob, createdAt: Date.now() });
            putReq.onsuccess = () => resolve();
            putReq.onerror = () => reject(putReq.error);
        });
    }

    public async loadRecording(): Promise<{ blob: Blob; createdAt: number } | null> {
        if (!this.db) await this.init();
        if (!this.db) return null;
        return new Promise((resolve) => {
            const tx = this.db!.transaction('custom_audio', 'readonly');
            const store = tx.objectStore('custom_audio');
            const req = store.get('primary_voice_memo');
            req.onsuccess = () => {
                if (req.result && req.result.blob) {
                    resolve({ blob: req.result.blob, createdAt: req.result.createdAt || Date.now() });
                } else {
                    resolve(null);
                }
            };
            req.onerror = () => resolve(null);
        });
    }

    public async deleteRecording(): Promise<void> {
        this.stopPlayback();
        if (!this.db) await this.init();
        if (!this.db) return;
        return new Promise((resolve) => {
            const tx = this.db!.transaction('custom_audio', 'readwrite');
            const store = tx.objectStore('custom_audio');
            const req = store.delete('primary_voice_memo');
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
        });
    }

    public async startRecording(): Promise<void> {
        this.stopPlayback();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.audioChunks.push(e.data);
        };
        this.mediaRecorder.start();
        this.isRecording = true;
    }

    public async stopRecording(): Promise<Blob> {
        return new Promise((resolve) => {
            if (!this.mediaRecorder) return;
            this.mediaRecorder.onstop = async () => {
                const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.isRecording = false;
                await this.saveRecording(blob);
                resolve(blob);
            };
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
        });
    }

    public setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
    }

    public setLoop(loop: boolean) {
        this.isInfiniteLoop = loop;
        if (this.audioElement) {
            this.audioElement.loop = loop;
        }
    }

    public getLoop(): boolean {
        return this.isInfiniteLoop;
    }

    public playBlob(blob: Blob, onEnded?: () => void) {
        this.stopPlayback();
        this.audioObjectUrl = URL.createObjectURL(blob);
        this.audioElement = new Audio(this.audioObjectUrl);
        this.audioElement.volume = this.volume;
        this.audioElement.loop = this.isInfiniteLoop;
        this.audioElement.onended = () => {
            if (!this.isInfiniteLoop && onEnded) onEnded();
        };
        this.audioElement.play().catch(e => console.warn('Audio play error:', e));
        this.isPlaying = true;
    }

    public stopPlayback() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }
        if (this.audioObjectUrl) {
            URL.revokeObjectURL(this.audioObjectUrl);
            this.audioObjectUrl = null;
        }
        this.isPlaying = false;
    }

    public getPlaybackStatus(): boolean {
        return this.isPlaying;
    }

    public getRecordingStatus(): boolean {
        return this.isRecording;
    }
}

export const SoundEngine = new BuiltInSoundEngine();
export const AudioRecorder = new CustomAudioRecorderEngine();
