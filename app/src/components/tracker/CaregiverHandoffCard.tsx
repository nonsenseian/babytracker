import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { ShiftProtocol } from '../../types/shift';
import { Users, ArrowRightLeft, Pin, Plus, X, Check, Clock, Baby, ShieldAlert } from 'lucide-react';

export const CaregiverHandoffCard: React.FC = () => {
    const { caregivers, caregiverShift, handOffShift, addShiftProtocol, removeShiftProtocol, logs, settings } = useApp();
    const [isHandoffOpen, setIsHandoffOpen] = useState<boolean>(false);
    const [selectedNextId, setSelectedNextId] = useState<string>('');
    const [handoverNote, setHandoverNote] = useState<string>('');
    const [isAddingProtocol, setIsAddingProtocol] = useState<boolean>(false);
    const [newProtocolText, setNewProtocolText] = useState<string>('');
    const [newProtocolCategory, setNewProtocolCategory] = useState<ShiftProtocol['category']>('general');
    const [now, setNow] = useState<number>(Date.now());

    // Update timer ticker
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(interval);
    }, []);

    const hasCaregivers = caregivers.length > 0;
    const activeCaregiver = caregivers.find(c => c.id === caregiverShift.activeCaregiverId) || caregivers[0] || {
        id: '',
        name: 'No Caregiver Set',
        role: 'None',
        emoji: '🧑'
    };

    const otherCaregivers = caregivers.filter(c => c.id !== activeCaregiver.id);

    // Compute active shift duration
    const shiftElapsedMs = Math.max(0, now - (caregiverShift.shiftStartTime || now));
    const shiftHours = Math.floor(shiftElapsedMs / (3600 * 1000));
    const shiftMinutes = Math.floor((shiftElapsedMs % (3600 * 1000)) / 60000);
    const shiftDurationStr = shiftHours > 0 ? `${shiftHours}h ${shiftMinutes}m` : `${shiftMinutes}m`;

    // Quick tag-team briefing data from latest logs
    const lastFeed = logs.find(l => l.category === 'feeding');
    const lastDiaper = logs.find(l => l.category === 'diaper');

    const formatTimeAgo = (timestamp?: number) => {
        if (!timestamp) return 'None yet';
        const diffMins = Math.max(0, Math.floor((now - timestamp) / 60000));
        if (diffMins < 60) return `${diffMins}m ago`;
        return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m ago`;
    };

    const handleConfirmHandoff = () => {
        const targetId = selectedNextId || (otherCaregivers[0]?.id || caregivers[0]?.id);
        if (!targetId) return;
        handOffShift(targetId, handoverNote.trim() || undefined);
        setIsHandoffOpen(false);
        setHandoverNote('');
        setSelectedNextId('');
    };

    const handleAddProtocol = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProtocolText.trim()) return;
        addShiftProtocol(newProtocolText.trim(), newProtocolCategory);
        setNewProtocolText('');
        setIsAddingProtocol(false);
    };

    return (
        <div
            id="caregiver-handoff-card"
            className="surface-card"
            style={{
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: '20px',
                position: 'relative'
            }}
        >
            {/* Header: Title and Hand Off Shift Button */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '14px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            backgroundColor: 'rgba(244, 63, 94, 0.12)',
                            color: '#f43f5e'
                        }}
                    >
                        <Users size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '15px',
                                fontWeight: 800,
                                letterSpacing: '-0.01em',
                                color: 'var(--text-primary)'
                            }}>
                                Caregiver Shift
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Hand Off Shift Button */}
                {hasCaregivers && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedNextId(otherCaregivers[0]?.id || '');
                            setIsHandoffOpen(!isHandoffOpen);
                        }}
                        className="btn-ghost"
                        style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            borderColor: isHandoffOpen ? 'var(--primary-accent)' : 'var(--border-color)',
                            backgroundColor: isHandoffOpen ? 'var(--bg-surface-elevated)' : 'transparent',
                            color: 'var(--text-primary)',
                            flexShrink: 0
                        }}
                    >
                        <ArrowRightLeft size={13} style={{ color: '#f43f5e' }} />
                        <span>{isHandoffOpen ? 'Cancel Hand-off' : 'Hand Off Shift'}</span>
                    </button>
                )}
            </div>

            {/* Active Caregiver Status Pill */}
            <div
                style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '14px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <span style={{ fontSize: '28px', lineHeight: 1, flexShrink: 0 }}>{hasCaregivers ? (activeCaregiver.emoji || '🧑') : '🧑‍🍼'}</span>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                {hasCaregivers ? activeCaregiver.name : 'No Care Team Designated'}
                            </span>
                            <span
                                style={{
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    backgroundColor: hasCaregivers ? 'rgba(244, 63, 94, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                                    color: hasCaregivers ? '#f43f5e' : 'var(--text-muted)',
                                    border: hasCaregivers ? '1px solid rgba(244, 63, 94, 0.25)' : '1px solid var(--border-color)'
                                }}
                            >
                                {hasCaregivers ? 'Active Caregiver' : 'Care Team Empty'}
                            </span>
                        </div>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '2px'
                        }}>
                            <span>Role: {hasCaregivers ? activeCaregiver.role : 'Designate members in Profile'}</span>
                            {hasCaregivers && (
                                <>
                                    <span>•</span>
                                    <span>Shift Time: {shiftDurationStr}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {hasCaregivers && caregiverShift.lastHandoverTime && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                        Last Hand-off: {formatTimeAgo(caregiverShift.lastHandoverTime)}
                    </div>
                )}
            </div>

            {/* Inline Hand-off Transition Drawer (When toggled open) */}
            {isHandoffOpen && (
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '2px solid #f43f5e',
                        borderRadius: '12px',
                        padding: '14px',
                        marginBottom: '14px',
                        boxShadow: '0 4px 14px rgba(244, 63, 94, 0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ArrowRightLeft size={14} />
                            <span>Confirm Caregiver Shift Transition</span>
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)' }}>
                            Transfers live duty & logs milestone
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            Select Next Caregiver:
                        </label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                            gap: '8px'
                        }}>
                            {caregivers.map(cg => {
                                const isSelected = (selectedNextId || otherCaregivers[0]?.id) === cg.id;
                                return (
                                    <button
                                        key={cg.id}
                                        type="button"
                                        onClick={() => setSelectedNextId(cg.id)}
                                        style={{
                                            padding: '8px 10px',
                                            borderRadius: '10px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            border: isSelected ? '2px solid #f43f5e' : '1px solid var(--border-color)',
                                            backgroundColor: isSelected ? 'rgba(244, 63, 94, 0.08)' : 'var(--bg-surface)',
                                            color: isSelected ? '#f43f5e' : 'var(--text-primary)'
                                        }}
                                    >
                                        <span style={{ fontSize: '18px', lineHeight: 1 }}>{cg.emoji || '🧑'}</span>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cg.name}</div>
                                            <div style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cg.role}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', margin: '4px 0', color: 'var(--text-secondary)' }}>
                                Handover Note (Optional):
                            </label>
                            <input
                                type="text"
                                value={handoverNote}
                                onChange={(e) => setHandoverNote(e.target.value)}
                                placeholder="e.g. Baby fell asleep at 1:30 AM after 75 mL bottle; next feed ~4:30 AM"
                                className="input-field"
                                style={{
                                    fontSize: '12px',
                                    padding: '8px 12px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
                            <button
                                type="button"
                                onClick={() => setIsHandoffOpen(false)}
                                className="btn-ghost"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmHandoff}
                                className="btn-primary"
                                style={{
                                    padding: '6px 14px',
                                    fontSize: '12px',
                                    backgroundColor: '#f43f5e',
                                    color: '#ffffff'
                                }}
                            >
                                <Check size={14} />
                                <span>Confirm Hand-off to {caregivers.find(c => c.id === (selectedNextId || otherCaregivers[0]?.id))?.name || 'Partner'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Glanceable Tag-Team Status Briefing (3 Cards) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '10px',
                marginBottom: '14px'
            }}>
                {/* Last Feed Glance */}
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 12px'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--text-muted)'
                    }}>
                        <span>Last Feed</span>
                        <Clock size={11} />
                    </div>
                    {lastFeed ? (
                        <div style={{ marginTop: '4px' }}>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {lastFeed.amountMl ? `${lastFeed.amountMl} mL` : `${lastFeed.durationMinutes || 20}m`}{' '}
                                {lastFeed.subType === 'formula' ? 'Formula' : 'Breastmilk'}
                            </div>
                            <div style={{
                                fontSize: '10px',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                marginTop: '2px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                at {lastFeed.timeStr} ({formatTimeAgo(lastFeed.timestamp)})
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginTop: '4px' }}>
                            No feeds logged yet
                        </div>
                    )}
                </div>

                {/* Last Diaper Glance */}
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 12px'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--text-muted)'
                    }}>
                        <span>Last Diaper</span>
                        <Baby size={11} />
                    </div>
                    {lastDiaper ? (
                        <div style={{ marginTop: '4px' }}>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {lastDiaper.subType === 'pee' ? 'Wet (🟡)' : lastDiaper.subType === 'poop' ? 'Dirty (💩)' : 'Wet & Dirty (🟡💩)'}
                            </div>
                            <div style={{
                                fontSize: '10px',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                marginTop: '2px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                at {lastDiaper.timeStr} ({formatTimeAgo(lastDiaper.timestamp)})
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginTop: '4px' }}>
                            No diapers logged yet
                        </div>
                    )}
                </div>

                {/* Next Reminder Interval */}
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 12px'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--text-muted)'
                    }}>
                        <span>Feed Reminder Target</span>
                        <ShieldAlert size={11} />
                    </div>
                    <div style={{ marginTop: '4px' }}>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            color: '#3b82f6',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            Every {settings.feedIntervalHours || 3} Hours
                        </div>
                        <div style={{
                            fontSize: '10px',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginTop: '2px'
                        }}>
                            Anchored to feed completion
                        </div>
                    </div>
                </div>
            </div>

            {/* Pinned Household Protocols & 2 AM Guardrails */}
            <div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                }}>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-primary)'
                    }}>
                        <Pin size={13} style={{ color: '#f43f5e' }} />
                        <span>Pinned Household Protocols (2 AM Guardrails)</span>
                    </span>

                    <button
                        type="button"
                        onClick={() => setIsAddingProtocol(!isAddingProtocol)}
                        style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--primary-accent)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px 6px'
                        }}
                    >
                        <Plus size={12} />
                        <span>Add Protocol</span>
                    </button>
                </div>

                {/* Add Protocol Form */}
                {isAddingProtocol && (
                    <form
                        onSubmit={handleAddProtocol}
                        style={{
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            padding: '12px',
                            marginBottom: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}
                    >
                        <input
                            type="text"
                            value={newProtocolText}
                            onChange={(e) => setNewProtocolText(e.target.value)}
                            placeholder="e.g. Elevate crib mattress 5 degrees for reflux"
                            className="input-field"
                            style={{
                                fontSize: '12px',
                                padding: '6px 10px'
                            }}
                            autoFocus
                        />

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {(['feeding', 'medication', 'soothing', 'general'] as const).map(cat => {
                                    const isCurrent = newProtocolCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setNewProtocolCategory(cat)}
                                            style={{
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                textTransform: 'capitalize',
                                                cursor: 'pointer',
                                                border: isCurrent ? '1px solid var(--primary-accent)' : '1px solid var(--border-color)',
                                                backgroundColor: isCurrent ? 'var(--primary-accent)' : 'transparent',
                                                color: isCurrent ? '#ffffff' : 'var(--text-muted)'
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingProtocol(false)}
                                    className="btn-ghost"
                                    style={{ padding: '4px 10px', fontSize: '11px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{
                                        padding: '4px 12px',
                                        fontSize: '11px',
                                        backgroundColor: 'var(--primary-accent)',
                                        color: '#ffffff'
                                    }}
                                >
                                    Pin Note
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* List of Pinned Protocols */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {caregiverShift.pinnedProtocols && caregiverShift.pinnedProtocols.length > 0 ? (
                        caregiverShift.pinnedProtocols.map(proto => (
                            <div
                                key={proto.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '10px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-surface)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                    <span style={{ fontSize: '12px', color: '#f43f5e', flexShrink: 0 }}>📌</span>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: 'var(--text-primary)',
                                        wordBreak: 'break-word',
                                        lineHeight: 1.4
                                    }}>
                                        {proto.text}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeShiftProtocol(proto.id)}
                                    title="Unpin instruction"
                                    aria-label="Unpin instruction"
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                            No active protocols pinned. Tap "+ Add Protocol" to pin medication or soothing notes for the night shift.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
