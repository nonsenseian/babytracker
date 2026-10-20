import React from 'react';
import type { ActivityLog } from '../../types/log';
import { useApp } from '../../context/AppContext';
import { ML_PER_OZ } from '../../engines/guardrails';
import { Trash2, Edit2 } from 'lucide-react';

interface ActivityCardProps {
    log: ActivityLog;
    onEdit: (log: ActivityLog) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ log, onEdit }) => {
    const { unit, deleteLog } = useApp();
    const isOz = unit === 'oz';

    const getCategoryDetails = () => {
        switch (log.category) {
            case 'feeding': {
                const amt = log.amountMl || 0;
                const formattedAmt = isOz ? `${(amt / ML_PER_OZ).toFixed(1)} oz` : `${amt} mL`;
                const feedTypeLabel = log.subType === 'nursing'
                    ? '🤱 Nursing'
                    : (log.subType === 'breastmilk' ? '🥛 Bottled Breastmilk' : '🍼 Bottled Formula');
                return {
                    title: `Feed • ${feedTypeLabel}`,
                    value: amt > 0 ? formattedAmt : (log.durationMinutes ? `${log.durationMinutes}m nursing` : 'Feed'),
                    color: '#f59e0b'
                };
            }
            case 'pumping': {
                const left = log.leftAmountMl || 0;
                const right = log.rightAmountMl || 0;
                const total = log.amountMl || (left + right);
                const formattedTot = isOz ? `${(total / ML_PER_OZ).toFixed(1)} oz` : `${total} mL`;
                return {
                    title: `Pumping Yield`,
                    value: formattedTot,
                    sub: left > 0 || right > 0 ? `L: ${left}mL • R: ${right}mL` : undefined,
                    color: '#ec4899'
                };
            }
            case 'diaper': {
                const typeLabel = log.subType === 'pee' ? '🟡 Wet' : (log.subType === 'poop' ? '💩 Dirty' : '🟣 Wet & Dirty');
                return {
                    title: `Diaper • ${typeLabel}`,
                    value: log.size ? `Size ${log.size}` : 'Diaper',
                    sub: log.poopTexture ? `Texture: ${log.poopTexture}` : undefined,
                    color: '#eab308'
                };
            }
            case 'sleep': {
                const hrs = ((log.durationMinutes || 0) / 60).toFixed(1);
                return {
                    title: `Sleep • ${log.isNightSleep ? '🌙 Night' : '☀️ Nap'}`,
                    value: `${hrs} hrs (${log.durationMinutes || 0}m)`,
                    color: '#6366f1'
                };
            }
            case 'tummy': {
                return {
                    title: `Tummy Time`,
                    value: `${log.durationMinutes || 0} mins`,
                    color: '#10b981'
                };
            }
            case 'growth': {
                const totalLbs = ((log.weightLbs || 0) + ((log.weightOz || 0) / 16)).toFixed(1);
                return {
                    title: `Growth Measurement`,
                    value: `${totalLbs} lbs`,
                    sub: log.heightInches ? `Length: ${log.heightInches}" • Head: ${log.headCircumference || '—'}"` : undefined,
                    color: '#3b82f6'
                };
            }
            case 'bath': {
                return {
                    title: `Bath Time 🛁`,
                    value: log.durationMinutes ? `${log.durationMinutes} mins` : 'Warm Bath',
                    color: '#06b6d4'
                };
            }
            case 'other': {
                const title = log.subType ? `Other • ${log.subType}` : 'Other Activity';
                return {
                    title: `📝 ${title}`,
                    value: log.durationMinutes ? `${log.durationMinutes} mins` : (log.notes || 'Activity'),
                    sub: log.durationMinutes && log.notes ? log.notes : undefined,
                    color: '#8b5cf6'
                };
            }
            default:
                return {
                    title: log.category,
                    value: log.notes || 'Activity',
                    color: '#94a3b8'
                };
        }
    };

    const details = getCategoryDetails();

    return (
        <div
            className="surface-card"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '12px',
                backgroundColor: `${details.color}12`,
                border: `1px solid ${details.color}35`,
                transition: 'all 0.15s ease'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {details.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                        <span>{log.timeStr}</span>
                        {details.sub && <span>• {details.sub}</span>}
                        {log.notes && <span>• "{log.notes}"</span>}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'var(--text-primary)'
                }}>
                    {details.value}
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => onEdit(log)}
                        className="btn-ghost"
                        style={{ padding: '6px' }}
                        title="Edit"
                    >
                        <Edit2 size={13} />
                    </button>
                    <button
                        onClick={() => deleteLog(log.id)}
                        className="btn-ghost"
                        style={{ padding: '6px', color: '#ef4444' }}
                        title="Delete"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
};
