import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';

export interface AchievementDef {
    id: string;
    cat: 'feeding' | 'streaks' | 'volume' | 'diapers' | 'sleep' | 'tummy' | 'nursery' | 'org';
    title: string;
    desc: string;
    icon: string;
    req: string;
}

export const ACHIEVEMENTS_DATA: AchievementDef[] = [
    // Feeding (1-10)
    { id: 'feed_first_drop', cat: 'feeding', title: 'First Drop', desc: 'Logged your very first feed', icon: '🍼', req: '1 feed' },
    { id: 'feed_hydration_bronze', cat: 'feeding', title: 'Hydration Bronze', desc: 'Reached daily feeding goal 1x', icon: '🥉', req: '1x goal' },
    { id: 'feed_hydration_silver', cat: 'feeding', title: 'Hydration Silver', desc: 'Reached daily feeding goal 10x', icon: '🥈', req: '10x goal' },
    { id: 'feed_hydration_gold', cat: 'feeding', title: 'Hydration Gold', desc: 'Reached daily feeding goal 100x', icon: '🥇', req: '100x goal' },
    { id: 'feed_bottle_novice', cat: 'feeding', title: 'Bottle Novice', desc: 'Logged 25 bottles of formula or milk', icon: '🍼', req: '25 feeds' },
    { id: 'feed_bottle_century', cat: 'feeding', title: 'Bottle Century', desc: 'Logged 100 bottles of formula or milk', icon: '💯', req: '100 feeds' },
    { id: 'feed_liquid_gold_pioneer', cat: 'feeding', title: 'Liquid Gold Pioneer', desc: 'Logged your very first pump session', icon: '🥛', req: '1 pump' },
    { id: 'feed_liquid_gold_500', cat: 'feeding', title: 'Liquid Gold 500', desc: 'Pumped a cumulative 500 mL', icon: '✨', req: '500 mL' },
    { id: 'feed_pumping_champion', cat: 'feeding', title: 'Pumping Champion', desc: 'Pumped a cumulative 5,000 mL', icon: '👑', req: '5,000 mL' },
    { id: 'feed_dual_nursing_master', cat: 'feeding', title: 'Dual Nursing Master', desc: 'Switched nursing breast in live timer', icon: '⏱️', req: 'L+R nursing' },

    // Streaks (11-18)
    { id: 'streak_day_one', cat: 'streaks', title: 'Day One', desc: 'Logged caregiving on your first day', icon: '🌱', req: '1 day' },
    { id: 'streak_3_day', cat: 'streaks', title: '3-Day Spark', desc: 'Kept a 3-consecutive-day logging streak', icon: '✨', req: '3 days' },
    { id: 'streak_7_day', cat: 'streaks', title: '7-Day Flame', desc: 'Kept a 7-consecutive-day logging streak', icon: '🔥', req: '7 days' },
    { id: 'streak_14_day', cat: 'streaks', title: '14-Day Blaze', desc: 'Kept a 14-consecutive-day logging streak', icon: '⚡', req: '14 days' },
    { id: 'streak_30_day', cat: 'streaks', title: '30-Day Inferno', desc: 'Logged for 30 consecutive days', icon: '🌟', req: '30 days' },
    { id: 'streak_60_day', cat: 'streaks', title: '60-Day Titan', desc: 'Logged for 60 consecutive days', icon: '🛡️', req: '60 days' },
    { id: 'streak_100_day', cat: 'streaks', title: '100-Day Centurion', desc: 'Logged for 100 consecutive days', icon: '🏛️', req: '100 days' },
    { id: 'streak_365_day', cat: 'streaks', title: '365-Day Yearling', desc: 'Celebrated 1 whole year of daily care', icon: '🎂', req: '365 days' },

    // Volume (19-25)
    { id: 'vol_starter', cat: 'volume', title: 'Caregiver Starter', desc: 'Logged 10 total care activities', icon: '📝', req: '10 logs' },
    { id: 'vol_quarter_century', cat: 'volume', title: 'Quarter Century', desc: 'Logged 25 total care activities', icon: '📋', req: '25 logs' },
    { id: 'vol_half_century', cat: 'volume', title: 'Half Century', desc: 'Logged 50 total care activities', icon: '🎯', req: '50 logs' },
    { id: 'vol_century', cat: 'volume', title: 'Century Caregiver', desc: 'Logged 100 total care activities', icon: '🏆', req: '100 logs' },
    { id: 'vol_bicentennial', cat: 'volume', title: 'Bicentennial', desc: 'Logged 200 total care activities', icon: '🎖️', req: '200 logs' },
    { id: 'vol_500_club', cat: 'volume', title: 'Five Hundred Club', desc: 'Logged 500 total care activities', icon: '💎', req: '500 logs' },
    { id: 'vol_grand', cat: 'volume', title: 'Grand Caregiver', desc: 'Logged 1,000 total care activities', icon: '👑', req: '1,000 logs' },

    // Diapers (26-31)
    { id: 'diaper_fresh_start', cat: 'diapers', title: 'Fresh Start', desc: 'Logged your very first diaper change', icon: '🚼', req: '1 diaper' },
    { id: 'diaper_wet_bronze', cat: 'diapers', title: 'Wet Diaper Bronze', desc: 'Logged 25 wet diapers', icon: '💧', req: '25 wet' },
    { id: 'diaper_dirty_bronze', cat: 'diapers', title: 'Dirty Diaper Bronze', desc: 'Logged 25 dirty diapers', icon: '💩', req: '25 dirty' },
    { id: 'diaper_century', cat: 'diapers', title: 'Diaper Century', desc: 'Logged 100 total diaper changes', icon: '💯', req: '100 diapers' },
    { id: 'diaper_hydrated_baby', cat: 'diapers', title: 'Hydrated Baby Badge', desc: 'Logged 6 or more diapers in one day', icon: '🌈', req: '6+ diapers/day' },
    { id: 'diaper_olympian', cat: 'diapers', title: 'Diaper Olympian', desc: 'Logged 500 total diaper changes', icon: '🏅', req: '500 diapers' },

    // Sleep (32-37)
    { id: 'sleep_first_slumber', cat: 'sleep', title: 'First Slumber', desc: 'Logged baby’s very first nap', icon: '😴', req: '1 nap' },
    { id: 'sleep_power_napper', cat: 'sleep', title: 'Power Napper', desc: 'Logged 10 daytime or nighttime naps', icon: '🌙', req: '10 naps' },
    { id: 'sleep_dream_weaver', cat: 'sleep', title: 'Dream Weaver', desc: 'Logged 50 soothing naps', icon: '☁️', req: '50 naps' },
    { id: 'sleep_through_night', cat: 'sleep', title: 'Sleeping Through Night', desc: 'Logged 5+ continuous hours (300m) of sleep', icon: '⭐', req: '300+ mins sleep' },
    { id: 'sleep_centurion', cat: 'sleep', title: 'Sleep Centurion', desc: 'Logged 100 total sleep sessions', icon: '🏰', req: '100 naps' },
    { id: 'sleep_rhythm_master', cat: 'sleep', title: 'Sleep Rhythm Master', desc: 'Logged regular naps across 3 consecutive days', icon: '🎶', req: '3 days nap rhythm' },

    // Tummy (38-41)
    { id: 'tummy_turtle_starter', cat: 'tummy', title: 'Turtle Starter', desc: 'Completed first tummy time session', icon: '🐢', req: '1 session' },
    { id: 'tummy_muscle_builder', cat: 'tummy', title: 'Muscle Builder', desc: 'Reached 10 cumulative minutes of tummy time', icon: '💪', req: '10 mins' },
    { id: 'tummy_pro', cat: 'tummy', title: 'Tummy Pro', desc: 'Reached 30 cumulative minutes of tummy time', icon: '🏅', req: '30 mins' },
    { id: 'tummy_champion', cat: 'tummy', title: 'Tummy Champion', desc: 'Reached 60 cumulative minutes of tummy time', icon: '🏆', req: '60 mins' },

    // Nursery & Voice (42-46)
    { id: 'sound_starter', cat: 'nursery', title: 'Sound Machine Starter', desc: 'Played a soothing nursery ambient track', icon: '📻', req: 'Play sound' },
    { id: 'sound_explorer', cat: 'nursery', title: 'Audio Explorer', desc: 'Explored all soothing ambient audio options', icon: '🎧', req: 'Try audio' },
    { id: 'sound_custom_lullaby', cat: 'nursery', title: 'Custom Lullaby', desc: 'Recorded personal voice or custom lullaby', icon: '🎙️', req: 'Record audio' },
    { id: 'voice_nightstand', cat: 'nursery', title: 'Nightstand Voice', desc: 'Logged activity hands-free via speech', icon: '🗣️', req: 'Voice command' },
    { id: 'voice_calibrated', cat: 'nursery', title: 'Speech Calibrated', desc: 'Adjusted speech trigger or nursery settings', icon: '⚙️', req: 'Configure settings' },

    // Security & Organization (47-50)
    { id: 'org_appointment_keeper', cat: 'org', title: 'Appointment Keeper', desc: 'Added a pediatrician or health appointment', icon: '📅', req: '1 appointment' },
    { id: 'org_calendar_synced', cat: 'org', title: 'Calendar Synced', desc: 'Exported iCal / Google Calendar schedule', icon: '🗓️', req: 'Export calendar' },
    { id: 'org_night_owl', cat: 'org', title: 'Night Owl Caregiver', desc: 'Logged care during midnight hours (12am – 5am)', icon: '🦉', req: '1 night log' },
    { id: 'org_team_caregivers', cat: 'org', title: 'Team Caregivers', desc: 'Created or joined a partner sync room', icon: '🤝', req: 'Connect partner' }
];

export const MilestoneTrophyCase: React.FC = () => {
    const { logs, streakDays } = useApp();
    const [currentFilter, setCurrentFilter] = useState<string>('all');
    const [unlocked, setUnlocked] = useState<Record<string, number>>(() => {
        try {
            return JSON.parse(localStorage.getItem('bt_achievements') || '{}');
        } catch (e) {
            return {};
        }
    });

    const playUnlockChime = useCallback(() => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.09);
                gain.gain.setValueAtTime(0.18, now + idx * 0.09);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.09);
                osc.stop(now + idx * 0.09 + 0.4);
            });
        } catch (e) {}
    }, []);

    // Check achievement unlock states against current logs
    useEffect(() => {
        const feeds = logs.filter(l => l.category === 'feeding');
        const pumps = logs.filter(l => l.category === 'pumping');
        const diapers = logs.filter(l => l.category === 'diaper');
        const sleeps = logs.filter(l => l.category === 'sleep');
        const tummies = logs.filter(l => l.category === 'tummy');

        let totalPumpMl = 0;
        pumps.forEach(p => {
            totalPumpMl += (Number(p.amountMl) || 0) + (Number(p.leftAmountMl) || 0) + (Number(p.rightAmountMl) || 0);
        });

        let totalTummyMinutes = 0;
        tummies.forEach(t => {
            totalTummyMinutes += (Number(t.durationMinutes) || 0);
        });

        let wetCount = 0;
        let dirtyCount = 0;
        diapers.forEach(d => {
            if (d.subType === 'pee' || d.subType === 'both') wetCount++;
            if (d.subType === 'poop' || d.subType === 'both') dirtyCount++;
        });

        const diapersByDay: Record<string, number> = {};
        diapers.forEach(d => {
            if (d.dateStr) diapersByDay[d.dateStr] = (diapersByDay[d.dateStr] || 0) + 1;
        });
        const maxDiapersInDay = Math.max(0, ...Object.values(diapersByDay));

        const feedVolByDay: Record<string, number> = {};
        feeds.forEach(f => {
            if (f.dateStr) feedVolByDay[f.dateStr] = (feedVolByDay[f.dateStr] || 0) + (Number(f.amountMl) || 0);
        });
        const goalTarget = 750;
        const daysGoalReached = Object.values(feedVolByDay).filter(v => v >= goalTarget).length;

        let maxSleepMins = 0;
        sleeps.forEach(s => {
            const dur = Number(s.durationMinutes) || 0;
            if (dur > maxSleepMins) maxSleepMins = dur;
        });

        const hasDualNursing = feeds.some(f =>
            (f.notes && (f.notes.toLowerCase().includes('switch') || f.notes.toLowerCase().includes('both'))) ||
            f.subType === 'nursing'
        );

        const conditions: Record<string, boolean> = {
            feed_first_drop: feeds.length >= 1,
            feed_hydration_bronze: daysGoalReached >= 1,
            feed_hydration_silver: daysGoalReached >= 10,
            feed_hydration_gold: daysGoalReached >= 100,
            feed_bottle_novice: feeds.length >= 25,
            feed_bottle_century: feeds.length >= 100,
            feed_liquid_gold_pioneer: pumps.length >= 1,
            feed_liquid_gold_500: totalPumpMl >= 500,
            feed_pumping_champion: totalPumpMl >= 5000,
            feed_dual_nursing_master: hasDualNursing,

            streak_day_one: streakDays >= 1,
            streak_3_day: streakDays >= 3,
            streak_7_day: streakDays >= 7,
            streak_14_day: streakDays >= 14,
            streak_30_day: streakDays >= 30,
            streak_60_day: streakDays >= 60,
            streak_100_day: streakDays >= 100,
            streak_365_day: streakDays >= 365,

            vol_starter: logs.length >= 10,
            vol_quarter_century: logs.length >= 25,
            vol_half_century: logs.length >= 50,
            vol_century: logs.length >= 100,
            vol_bicentennial: logs.length >= 200,
            vol_500_club: logs.length >= 500,
            vol_grand: logs.length >= 1000,

            diaper_fresh_start: diapers.length >= 1,
            diaper_wet_bronze: wetCount >= 25,
            diaper_dirty_bronze: dirtyCount >= 25,
            diaper_century: diapers.length >= 100,
            diaper_hydrated_baby: maxDiapersInDay >= 6,
            diaper_olympian: diapers.length >= 500,

            sleep_first_slumber: sleeps.length >= 1,
            sleep_power_napper: sleeps.length >= 10,
            sleep_dream_weaver: sleeps.length >= 50,
            sleep_through_night: maxSleepMins >= 300,
            sleep_centurion: sleeps.length >= 100,
            sleep_rhythm_master: streakDays >= 3 && sleeps.length >= 6,

            tummy_turtle_starter: tummies.length >= 1,
            tummy_muscle_builder: totalTummyMinutes >= 10,
            tummy_pro: totalTummyMinutes >= 30,
            tummy_champion: totalTummyMinutes >= 60,

            sound_starter: Boolean(localStorage.getItem('bt_sound_played')),
            sound_explorer: Boolean(localStorage.getItem('bt_sound_all_tested')),
            sound_custom_lullaby: Boolean(localStorage.getItem('bt_custom_audio_saved')),
            voice_nightstand: Boolean(localStorage.getItem('bt_voice_logged')),
            voice_calibrated: Boolean(localStorage.getItem('bt_voice_calibrated')),

            org_appointment_keeper: Boolean(localStorage.getItem('bt_appointments_saved')),
            org_calendar_synced: Boolean(localStorage.getItem('bt_calendar_synced')),
            org_night_owl: logs.some(l => {
                const d = new Date(l.timestamp);
                const h = d.getHours();
                return h >= 0 && h < 5;
            }) || Boolean(unlocked['org_safe_vault']),
            org_team_caregivers: Boolean(localStorage.getItem('bt_sync_connected') || window.location.search.includes('room='))
        };

        let newlyUnlockedCount = 0;
        const nextUnlocked = { ...unlocked };

        ACHIEVEMENTS_DATA.forEach(ach => {
            if (!nextUnlocked[ach.id] && conditions[ach.id]) {
                nextUnlocked[ach.id] = Date.now();
                newlyUnlockedCount++;
            }
        });

        if (newlyUnlockedCount > 0) {
            setUnlocked(nextUnlocked);
            localStorage.setItem('bt_achievements', JSON.stringify(nextUnlocked));
            playUnlockChime();
        }
    }, [logs, streakDays, unlocked, playUnlockChime]);

    const unlockedCount = useMemo(() => Object.keys(unlocked).length, [unlocked]);
    const progressPercent = Math.min(100, Math.round((unlockedCount / ACHIEVEMENTS_DATA.length) * 100));

    const filterCategories = [
        { key: 'all', label: `All (${ACHIEVEMENTS_DATA.length})` },
        { key: 'feeding', label: 'Feeding (10)' },
        { key: 'streaks', label: 'Streaks (8)' },
        { key: 'volume', label: 'Volume (7)' },
        { key: 'diapers', label: 'Diapers (6)' },
        { key: 'sleep', label: 'Sleep (6)' },
        { key: 'tummy', label: 'Tummy (4)' },
        { key: 'nursery', label: 'Nursery & Voice (5)' },
        { key: 'org', label: 'Safety & Sync (4)' }
    ];

    const filteredAchievements = useMemo(() => {
        if (currentFilter === 'all') return ACHIEVEMENTS_DATA;
        return ACHIEVEMENTS_DATA.filter(a => a.cat === currentFilter);
    }, [currentFilter]);

    return (
        <section id="milestone-trophy-case" className="surface-card" style={{ marginTop: '24px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '28px' }}>🏆</span>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                            Milestone Trophy Case
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                            50 caregiving achievements across feeding, streaks, volume, diapers, sleep & nursery
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '130px' }}>
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 900,
                        fontFamily: 'JetBrains Mono, monospace',
                        color: 'var(--primary-accent, #d97706)'
                    }}>
                        {unlockedCount} / {ACHIEVEMENTS_DATA.length} Unlocked
                    </span>
                    <div style={{
                        width: '130px',
                        height: '8px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--bg-surface-elevated, #e2e8f0)',
                        overflow: 'hidden',
                        marginTop: '4px'
                    }}>
                        <div style={{
                            width: `${progressPercent}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #f59e0b, #eab308)',
                            borderRadius: '999px',
                            transition: 'width 0.4s ease'
                        }} />
                    </div>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginBottom: '16px'
            }}>
                {filterCategories.map(cat => {
                    const isActive = currentFilter === cat.key;
                    return (
                        <button
                            key={cat.key}
                            onClick={() => setCurrentFilter(cat.key)}
                            style={{
                                padding: '5px 10px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: 800,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                background: isActive ? '#f59e0b' : 'var(--bg-surface-elevated, #f1f5f9)',
                                color: isActive ? '#ffffff' : 'var(--text-secondary, #64748b)'
                            }}
                        >
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Trophy Grid (50 Achievements) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '10px'
            }}>
                {filteredAchievements.map(ach => {
                    const isUnlocked = Boolean(unlocked[ach.id]);
                    const unlockDate = isUnlocked ? new Date(unlocked[ach.id]).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                    }) : 'Pending';

                    return (
                        <div
                            key={ach.id}
                            className="surface-elevated"
                            style={{
                                padding: '12px',
                                borderRadius: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                border: isUnlocked ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                                background: isUnlocked ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-surface-elevated)',
                                boxShadow: isUnlocked ? '0 2px 8px rgba(245, 158, 11, 0.12)' : 'none',
                                opacity: isUnlocked ? 1 : 0.72,
                                transition: 'transform 0.15s ease'
                            }}
                        >
                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: '6px',
                                    marginBottom: '6px'
                                }}>
                                    <span style={{ fontSize: '24px' }}>{ach.icon}</span>
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: 800,
                                        fontFamily: 'JetBrains Mono, monospace',
                                        textTransform: 'uppercase',
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        background: isUnlocked ? '#f59e0b' : 'var(--border-color, #cbd5e1)',
                                        color: isUnlocked ? '#ffffff' : 'var(--text-muted, #64748b)'
                                    }}>
                                        {isUnlocked ? '✨ Done' : '🔒 Locked'}
                                    </span>
                                </div>
                                <h4 style={{
                                    fontSize: '12px',
                                    fontWeight: 900,
                                    color: 'var(--text-primary)',
                                    margin: '0 0 2px 0',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {ach.title}
                                </h4>
                                <p style={{
                                    fontSize: '10px',
                                    color: 'var(--text-muted)',
                                    margin: 0,
                                    lineHeight: 1.3,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {ach.desc}
                                </p>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '9px',
                                fontFamily: 'JetBrains Mono, monospace',
                                color: 'var(--text-muted)',
                                paddingTop: '8px',
                                marginTop: '8px',
                                borderTop: '1px solid var(--border-color)'
                            }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85px' }}>
                                    {ach.req}
                                </span>
                                <span>{unlockDate}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
