import React from 'react';
import { Lightbulb } from 'lucide-react';

interface ClinicalInsightCardProps {
    metric: string;
}

export const ClinicalInsightCard: React.FC<ClinicalInsightCardProps> = ({ metric }) => {
    // Feeding pediatric intake recommendation is integrated directly inside FormulaCalculatorCard underneath Log Bottle.
    if (metric === 'feeding') {
        return null;
    }

    const insights: { [key: string]: { title: string; desc: string } } = {
        growth: {
            title: 'WHO Trajectory Standard',
            desc: 'Healthy infants generally regain their birth weight by day 10–14 and approximately double birth weight by 4–6 months.'
        },
        diaper: {
            title: 'Hydration Indicator',
            desc: '6+ pale wet diapers and at least 3-4 soft stools daily confirm robust hydration and adequate caloric absorption.'
        },
        diapers: {
            title: 'Hydration Indicator',
            desc: '6+ pale wet diapers and at least 3-4 soft stools daily confirm robust hydration and adequate caloric absorption.'
        },
        sleep: {
            title: 'Circadian Wake Windows',
            desc: 'Newborns aged 4–8 weeks typically sustain 45–60 minute wake windows between restorative day naps and night intervals.'
        },
        pumping: {
            title: 'Prolactin Circadian Cycle',
            desc: 'Pumping yield peaks naturally in early morning hours due to nocturnal prolactin surges and stabilizes toward evening.'
        },
        tummy: {
            title: 'Motor Milestone Progression',
            desc: '3 to 5 minutes of tummy time, 2–3 times daily, rapidly strengthens neck, shoulder, and spinal extensor muscles.'
        }
    };

    const current = insights[metric] || insights.growth;
    if (!current) return null;

    return (
        <div className="surface-elevated" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: '12px',
            marginTop: '16px'
        }}>
            <div style={{ color: 'var(--primary-accent)' }}>
                <Lightbulb size={20} />
            </div>
            <div>
                <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', marginRight: '6px' }}>
                    {current.title}:
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {current.desc}
                </span>
            </div>
        </div>
    );
};
