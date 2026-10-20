import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { ChildProfile, Caregiver } from '../../types/profile';
import { ChildProfileModal } from '../modals/ChildProfileModal';
import { Copy, Check, Plus, Edit2, Shield, X, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';

function calculateAgeInDays(birthDateStr: string): number {
    if (!birthDateStr) return 0;
    const birth = new Date(birthDateStr + 'T12:00:00');
    const now = new Date();
    const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const diffMs = todayNoon.getTime() - birth.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function getBabyAgeString(birthDateStr: string): string {
    const diffDays = calculateAgeInDays(birthDateStr);
    if (diffDays >= 60) {
        const months = Math.floor(diffDays / 30.4375);
        return `${months} Months Old`;
    } else if (diffDays >= 14) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} Weeks Old`;
    } else if (diffDays === 0) {
        return 'Born Today! 👶';
    } else {
        return `${diffDays} Day${diffDays === 1 ? '' : 's'} Old`;
    }
}

export function formatDisplayDate(dateStr: string): string {
    if (!dateStr) return 'Date unset';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface FamilyProfileViewProps {
    onOpenChildModal?: () => void;
    onOpenCouplesSync?: () => void;
    onOpenSettings?: () => void;
}

export const FamilyProfileView: React.FC<FamilyProfileViewProps> = ({ onOpenChildModal: _onOpenChildModal, onOpenCouplesSync, onOpenSettings }) => {
    const { activeChild, children, caregivers, logs, setActiveChildId, saveCaregiver, addCaregiver, deleteCaregiver } = useApp();

    const [childModalTarget, setChildModalTarget] = useState<ChildProfile | null | undefined>(undefined);
    const [caregiverModalTarget, setCaregiverModalTarget] = useState<Caregiver | null>(null);
    const [isNewCaregiver, setIsNewCaregiver] = useState(false);
    const [copied, setCopied] = useState(false);

    // Auto-scroll active child card into view in horizontal carousel
    const activeChildCardRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (activeChildCardRef.current) {
            try {
                activeChildCardRef.current.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'nearest',
                    block: 'nearest'
                });
            } catch (e) {}
        }
    }, [activeChild.id]);

    // Caregiver edit state
    const [cgName, setCgName] = useState('');
    const [cgRole, setCgRole] = useState('');
    const [cgEmoji, setCgEmoji] = useState('');

    const openEditCaregiver = (cg: Caregiver) => {
        setIsNewCaregiver(false);
        setCaregiverModalTarget(cg);
        setCgName(cg.name);
        setCgRole(cg.role);
        setCgEmoji(cg.emoji);
    };

    const openAddCaregiver = () => {
        if (caregivers.length >= 4) return;
        setIsNewCaregiver(true);
        setCaregiverModalTarget({ id: '', name: '', role: 'Care Partner', emoji: '🧑' });
        setCgName('');
        setCgRole('Care Partner');
        setCgEmoji('🧑');
    };

    const handleSaveCaregiver = (e: React.FormEvent) => {
        e.preventDefault();
        if (!caregiverModalTarget) return;

        if (isNewCaregiver) {
            addCaregiver({
                name: cgName.trim() || 'Caregiver',
                role: cgRole.trim() || 'Care Partner',
                emoji: cgEmoji || '🧑'
            });
        } else {
            saveCaregiver({
                ...caregiverModalTarget,
                name: cgName.trim() || caregiverModalTarget.name,
                role: cgRole.trim() || caregiverModalTarget.role,
                emoji: cgEmoji || caregiverModalTarget.emoji
            });
        }
        setCaregiverModalTarget(null);
    };

    const handleDeleteCaregiver = () => {
        if (!caregiverModalTarget || isNewCaregiver) return;
        if (window.confirm(`Are you sure you want to remove ${caregiverModalTarget.name} from the care team?`)) {
            deleteCaregiver(caregiverModalTarget.id);
            setCaregiverModalTarget(null);
        }
    };

    const copyClinicalSummary = () => {
        const child = activeChild;
        const text = `🏥 PEDIATRIC HEALTH SUMMARY FOR ${child.name.toUpperCase()}
• Date of Birth: ${child.birthDate || 'N/A'} (${getBabyAgeString(child.birthDate)})
• Current Weight: ${child.currentWeight || `${child.birthWeightLbs || 0} lbs ${child.birthWeightOz || 0} oz`}
• Birth Length: ${child.birthHeightInches ? `${child.birthHeightInches} in` : 'N/A'}
• Blood Type: ${child.bloodType || 'O+'}
• Allergies: ${child.allergies || 'None known'}
• Pediatrician: ${child.pediatrician || 'Dr. Sarah Smith, MD'}
• Recent Logged Activities: ${logs.length}
Generated via NovaBaby Scalable Care Suite`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 1. Family Summary & Caregiver Hero Banner (Matches Web Version, with clean representative title) */}
            <div className="surface-card" style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(245, 158, 11, 0.05) 50%, rgba(168, 85, 247, 0.08) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '24px',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        boxShadow: '0 4px 12px rgba(56, 189, 248, 0.25)',
                        flexShrink: 0
                    }}>
                        👨‍👩‍👧
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                                Family Profile & Care Circle
                            </h2>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '8px',
                                backgroundColor: '#0284c7',
                                color: '#ffffff',
                                fontFamily: 'JetBrains Mono, monospace',
                                textTransform: 'uppercase'
                            }}>
                                {children.length} {children.length === 1 ? 'Child' : 'Children'}
                            </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                            Pediatric vitals, sibling profiles, medical contacts & interactive family tree
                        </p>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => setChildModalTarget(null)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <Plus size={14} />
                        <span>Add Child / Sibling</span>
                    </button>

                    {onOpenCouplesSync && (
                        <button
                            type="button"
                            onClick={onOpenCouplesSync}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                borderRadius: '12px',
                                background: 'var(--bg-surface-elevated)',
                                border: '1px solid rgba(56, 189, 248, 0.4)',
                                color: '#0284c7',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                            <span>Caregiver Sync</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Top Interactive Diagram: Care Team & Family Tree (matches Image 1 & 3) */}
            <div className="surface-card" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '24px clamp(12px, 3vw, 20px)',
                position: 'relative',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}>
                {/* 1. Family Tree Title Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    marginBottom: '20px',
                    paddingBottom: '14px',
                    borderBottom: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '10px',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '26px', flexShrink: 0 }}>🌳</span>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                                Family Tree & Care Circle
                            </h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                Primary caregivers, support team, and child profile hierarchy
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '999px',
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#0284c7',
                            fontSize: '12px',
                            fontWeight: 800
                        }}>
                            <Shield size={14} style={{ color: '#f59e0b' }} />
                            <span>Care Team ({caregivers.length}/4)</span>
                        </div>
                    </div>
                </div>

                {/* Top Row: Mom on Left, Care Team in Center, Dad on Right (Exact layout with safe centering & mobile scrolling) */}
                <div
                    id="family-tree-caregivers-container"
                    className="family-tree-caregivers-scroll"
                    style={{
                        justifyContent: caregivers.length > 2 ? 'flex-start' : 'safe center'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: caregivers.length > 2 ? 'flex-start' : 'center',
                        gap: 'clamp(8px, 2.5vw, 20px)',
                        minWidth: 'min-content',
                        maxWidth: '560px',
                        width: '100%',
                        padding: '0 4px',
                        boxSizing: 'border-box'
                    }}>
                        {caregivers.length === 0 ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '16px 20px',
                                textAlign: 'center',
                                width: '100%'
                            }}>
                                <span style={{ fontSize: '32px' }}>🧑‍🍼</span>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    No Care Team Members Designated
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '320px' }}>
                                    Designate parents, partners, or caregivers to enable shift tracking and collaborative hand-offs.
                                </span>
                                <button
                                    type="button"
                                    id="btn-add-first-caregiver"
                                    onClick={openAddCaregiver}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '7px 16px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        backgroundColor: '#0284c7',
                                        color: '#ffffff',
                                        border: 'none',
                                        cursor: 'pointer',
                                        marginTop: '4px'
                                    }}
                                >
                                    <Plus size={14} />
                                    <span>+ Add Caregiver</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Caregiver 1 */}
                                {caregivers[0] && (
                                    <div
                                        onClick={() => openEditCaregiver(caregivers[0])}
                                        className="surface-elevated"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            padding: '12px clamp(8px, 2vw, 16px)',
                                            borderRadius: '16px',
                                            minWidth: '95px',
                                            maxWidth: '150px',
                                            flex: '1 1 0',
                                            boxSizing: 'border-box',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.15s ease',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        <span style={{ fontSize: '32px', marginBottom: '2px', flexShrink: 0 }}>{caregivers[0].emoji || '👩'}</span>
                                        <span style={{
                                            fontSize: '13px',
                                            fontWeight: 800,
                                            color: 'var(--text-primary)',
                                            maxWidth: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            display: 'block'
                                        }} title={caregivers[0].name}>
                                            {caregivers[0].name}
                                        </span>
                                        <span style={{
                                            fontSize: '9px',
                                            fontWeight: 800,
                                            color: '#10b981',
                                            textTransform: 'uppercase',
                                            marginTop: '2px',
                                            maxWidth: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            display: 'block'
                                        }} title={caregivers[0].role}>
                                            {caregivers[0].role}
                                        </span>
                                        <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                                            ✏️ Edit
                                        </span>
                                    </div>
                                )}

                                {/* Center Care Team Pill */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px clamp(8px, 1.5vw, 14px)',
                                    borderRadius: '999px',
                                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                    border: '1px solid rgba(56, 189, 248, 0.35)',
                                    color: '#0284c7',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                }}>
                                    <span>💛</span>
                                    <span>Care Team</span>
                                </div>

                                {/* Caregiver 2 */}
                                {caregivers[1] && (
                                    <div
                                        onClick={() => openEditCaregiver(caregivers[1])}
                                        className="surface-elevated"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            padding: '12px clamp(8px, 2vw, 16px)',
                                            borderRadius: '16px',
                                            minWidth: '95px',
                                            maxWidth: '150px',
                                            flex: '1 1 0',
                                            boxSizing: 'border-box',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.15s ease',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        <span style={{ fontSize: '32px', marginBottom: '2px', flexShrink: 0 }}>{caregivers[1].emoji || '👨'}</span>
                                        <span style={{
                                            fontSize: '13px',
                                            fontWeight: 800,
                                            color: 'var(--text-primary)',
                                            maxWidth: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            display: 'block'
                                        }} title={caregivers[1].name}>
                                            {caregivers[1].name}
                                        </span>
                                        <span style={{
                                            fontSize: '9px',
                                            fontWeight: 800,
                                            color: '#0284c7',
                                            textTransform: 'uppercase',
                                            marginTop: '2px',
                                            maxWidth: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            display: 'block'
                                        }} title={caregivers[1].role}>
                                            {caregivers[1].role}
                                        </span>
                                        <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                                            ✏️ Edit
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Additional Support Caregivers / Add Caregiver (if any) */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '12px',
                    flexWrap: 'wrap',
                    maxWidth: '100%',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin',
                    boxSizing: 'border-box',
                    padding: '2px 4px'
                }}>
                    {caregivers.slice(2).map(cg => (
                        <div
                            key={cg.id}
                            onClick={() => openEditCaregiver(cg)}
                            className="surface-elevated"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 12px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                border: '1px solid var(--border-color)',
                                maxWidth: '180px',
                                boxSizing: 'border-box'
                            }}
                        >
                            <span style={{ fontSize: '18px', flexShrink: 0 }}>{cg.emoji || '🧑'}</span>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '90px',
                                display: 'inline-block'
                            }} title={cg.name}>{cg.name}</span>
                            <span style={{
                                fontSize: '9px',
                                color: '#0284c7',
                                fontWeight: 700,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '60px',
                                display: 'inline-block'
                            }} title={cg.role}>({cg.role})</span>
                            <span style={{ fontSize: '10px', color: '#f59e0b', flexShrink: 0 }}>✏️</span>
                        </div>
                    ))}

                    {caregivers.length < 4 && (
                        <button
                            type="button"
                            onClick={openAddCaregiver}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '12px',
                                border: '1px dashed var(--border-color)',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                flexShrink: 0,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <Plus size={13} style={{ color: 'var(--primary-accent)' }} />
                            <span>Add Caregiver ({caregivers.length}/4)</span>
                        </button>
                    )}
                </div>

                {/* Connector Tree Branch SVG */}
                <div style={{ width: '100%', maxWidth: '340px', height: '36px', display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                    <svg viewBox="0 0 200 32" style={{ width: '100%', height: '100%', color: '#f59e0b' }} fill="none">
                        <path d="M 100 0 L 100 16 M 40 32 C 40 16, 160 16, 160 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                </div>

                {/* Children / Siblings Row with horizontal scroll & text truncation */}
                <div
                    id="family-tree-children-container"
                    className="family-tree-children-scroll"
                    style={{
                        justifyContent: children.length >= 2 ? 'flex-start' : 'safe center'
                    }}
                >
                    {children.map(child => {
                        const isActive = child.id === activeChild.id;
                        const ageStr = getBabyAgeString(child.birthDate);

                        return (
                            <div
                                key={child.id}
                                id={`family-tree-child-${child.id}`}
                                ref={isActive ? activeChildCardRef : undefined}
                                onClick={() => setActiveChildId(child.id)}
                                className="surface-elevated"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '14px 18px',
                                    borderRadius: '18px',
                                    minWidth: '100px',
                                    maxWidth: '150px',
                                    boxSizing: 'border-box',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.15s ease',
                                    border: isActive ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                                    background: isActive ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-surface-elevated)',
                                    boxShadow: isActive ? '0 0 0 3px rgba(245, 158, 11, 0.25)' : 'none'
                                }}
                            >
                                <span style={{ fontSize: '32px', marginBottom: '2px', flexShrink: 0 }}>{child.avatarEmoji || '👶'}</span>
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    color: 'var(--text-primary)',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'block'
                                }} title={child.name}>{child.name}</span>
                                <span style={{
                                    fontSize: '10px',
                                    color: 'var(--text-muted)',
                                    fontFamily: 'JetBrains Mono, monospace',
                                    marginTop: '2px',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'block'
                                }}>
                                    {ageStr}
                                </span>
                                {isActive ? (
                                    <span style={{
                                        marginTop: '6px',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        backgroundColor: '#f59e0b',
                                        color: 'var(--primary-accent-contrast, #ffffff)',
                                        fontSize: '9px',
                                        fontWeight: 800,
                                        letterSpacing: '0.04em',
                                        textTransform: 'uppercase',
                                        flexShrink: 0
                                    }}>
                                        ACTIVE
                                    </span>
                                ) : (
                                    <span style={{
                                        marginTop: '6px',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        color: 'var(--text-muted)',
                                        fontSize: '9px',
                                        fontWeight: 800,
                                        letterSpacing: '0.04em',
                                        textTransform: 'uppercase',
                                        flexShrink: 0
                                    }}>
                                        SWITCH
                                    </span>
                                )}
                            </div>
                        );
                    })}

                    {/* Add Sibling Button (Capped at 6 children) */}
                    <button
                        type="button"
                        disabled={children.length >= 6}
                        onClick={() => {
                            if (children.length >= 6) {
                                alert('Pro tier cap reached: Maximum 6 children allowed.');
                                return;
                            }
                            setChildModalTarget(null);
                        }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '14px 18px',
                            borderRadius: '18px',
                            minWidth: '110px',
                            minHeight: '115px',
                            flexShrink: 0,
                            cursor: children.length >= 6 ? 'not-allowed' : 'pointer',
                            textAlign: 'center',
                            border: '2px dashed #f59e0b',
                            background: 'transparent',
                            color: children.length >= 6 ? 'var(--text-muted)' : '#d97706',
                            opacity: children.length >= 6 ? 0.5 : 1,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <Plus size={24} style={{ color: children.length >= 6 ? 'var(--text-muted)' : '#8b5cf6', marginBottom: '4px' }} />
                        <span style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                            {children.length >= 6 ? 'Max 6 Kids' : 'Add Sibling'}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                            ({children.length}/6)
                        </span>
                    </button>
                </div>
            </div>

            {/* Bottom Section: All Children & Sibling Profiles (matches Image 3) */}
            <div className="surface-card">
                {/* Header */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '18px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '26px' }}>🧸</span>
                        <div>
                            <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                                All Children & Sibling Profiles
                            </h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                Manage independent logs, measurement timelines and care routines for each child
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={copyClinicalSummary}
                            className="btn-ghost"
                            style={{ fontSize: '12px', padding: '8px 12px' }}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copied ? 'Copied Doctor Dossier!' : 'Copy Clinical Summary'}</span>
                        </button>
                        <button
                            disabled={children.length >= 6}
                            onClick={() => {
                                if (children.length >= 6) {
                                    alert('Pro tier cap reached: Maximum 6 children allowed.');
                                    return;
                                }
                                setChildModalTarget(null);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                borderRadius: '12px',
                                border: 'none',
                                background: children.length >= 6 ? 'var(--text-muted)' : '#f59e0b',
                                color: '#ffffff',
                                fontSize: '13px',
                                fontWeight: 800,
                                cursor: children.length >= 6 ? 'not-allowed' : 'pointer',
                                boxShadow: children.length >= 6 ? 'none' : '0 2px 6px rgba(245, 158, 11, 0.3)',
                                opacity: children.length >= 6 ? 0.6 : 1
                            }}
                        >
                            <Plus size={16} />
                            <span>{children.length >= 6 ? 'Max 6 Children' : 'Add Child Profile'}</span>
                        </button>
                    </div>
                </div>

                {/* Grid of Child Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
                    gap: '14px',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                }}>
                    {children.map(child => {
                        const isActive = child.id === activeChild.id;
                        const ageStr = getBabyAgeString(child.birthDate);
                        const displayDate = formatDisplayDate(child.birthDate);
                        const weightDisplay = child.currentWeight || (child.birthWeightLbs ? `${child.birthWeightLbs} lbs ${child.birthWeightOz || 0} oz` : '9 lbs 4 oz');
                        const docDisplay = child.pediatrician || 'Dr. Smith';

                        return (
                            <div
                                key={child.id}
                                className="surface-elevated"
                                style={{
                                    padding: '16px',
                                    borderRadius: '16px',
                                    border: isActive ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: isActive ? '0 0 0 2px rgba(245, 158, 11, 0.2)' : 'none',
                                    maxWidth: '100%',
                                    boxSizing: 'border-box',
                                    overflow: 'hidden'
                                }}
                            >
                                <div>
                                    {/* Top Row: Avatar, Name, Gender, Active Badge */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '12px',
                                        gap: '8px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                            <span style={{
                                                fontSize: '24px',
                                                padding: '6px',
                                                borderRadius: '12px',
                                                background: 'rgba(245, 158, 11, 0.12)',
                                                flexShrink: 0
                                            }}>
                                                {child.avatarEmoji || '👶'}
                                            </span>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <h4 style={{
                                                    fontSize: '15px',
                                                    fontWeight: 900,
                                                    color: 'var(--text-primary)',
                                                    margin: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={child.name}>{child.name}</span>
                                                    {child.gender === 'boy' && <span style={{ color: '#0284c7', fontSize: '13px', flexShrink: 0 }}>♂</span>}
                                                    {child.gender === 'girl' && <span style={{ color: '#ec4899', fontSize: '13px', flexShrink: 0 }}>♀</span>}
                                                </h4>
                                                <span style={{
                                                    fontSize: '11px',
                                                    color: 'var(--text-muted)',
                                                    fontFamily: 'JetBrains Mono, monospace'
                                                }}>
                                                    {displayDate} ({ageStr})
                                                </span>
                                            </div>
                                        </div>

                                        {isActive && (
                                            <span style={{
                                                padding: '3px 8px',
                                                borderRadius: '999px',
                                                backgroundColor: '#f59e0b',
                                                color: '#ffffff',
                                                fontSize: '10px',
                                                fontWeight: 800,
                                                letterSpacing: '0.04em'
                                            }}>
                                                ACTIVE
                                            </span>
                                        )}
                                    </div>

                                    {/* Vitals stats: Weight, Pediatrician, Allergies */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '8px',
                                        padding: '10px 0',
                                        borderTop: '1px solid var(--border-color)',
                                        borderBottom: '1px solid var(--border-color)',
                                        fontSize: '11px',
                                        color: 'var(--text-primary)'
                                    }}>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Weight:</span>
                                            <b>{weightDisplay}</b>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Pediatrician:</span>
                                            <b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                                {docDisplay}
                                            </b>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Allergies:</span>
                                            <b style={{ color: child.allergies && child.allergies !== 'None known' ? '#ef4444' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                                {child.allergies || 'None known'}
                                            </b>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Action Buttons: Switch / Active + Edit */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    paddingTop: '12px'
                                }}>
                                    {isActive ? (
                                        <span style={{
                                            flex: 1,
                                            textAlign: 'center',
                                            fontSize: '12px',
                                            fontWeight: 800,
                                            color: '#f59e0b'
                                        }}>
                                            Currently Active
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setActiveChildId(child.id)}
                                            style={{
                                                flex: 1,
                                                padding: '6px 12px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                backgroundColor: '#f59e0b',
                                                color: '#ffffff',
                                                fontSize: '12px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                transition: 'background 0.15s ease'
                                            }}
                                        >
                                            Switch
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        id={`child-card-edit-btn-${child.id}`}
                                        className="child-card-edit-btn"
                                        onClick={() => setChildModalTarget(child)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '6px 12px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-surface)',
                                            color: 'var(--text-primary)',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Edit2 size={12} />
                                        <span>Edit</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Family Account & Security Settings Navigation Link */}
            <div id="profile-account-settings-link" className="surface-card" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#10b981'
                    }}>
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            Family Account & Security
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                            Authenticated credentials, password changes, and session security are managed in Settings.
                        </p>
                    </div>
                </div>

                {onOpenSettings && (
                    <button
                        type="button"
                        id="btn-profile-open-settings"
                        onClick={onOpenSettings}
                        className="btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            fontSize: '12px',
                            fontWeight: 800
                        }}
                    >
                        <SettingsIcon size={14} />
                        <span>Open Account Settings</span>
                    </button>
                )}
            </div>

            {/* Child Profile Modal (for Editing specific child or Adding sibling) */}
            {childModalTarget !== undefined && (
                <ChildProfileModal
                    childToEdit={childModalTarget}
                    onClose={() => setChildModalTarget(undefined)}
                />
            )}

            {/* Caregiver Customization Modal */}
            {caregiverModalTarget && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.55)',
                    backdropFilter: 'blur(4px)',
                    padding: '16px'
                }}>
                    <div className="surface-card" style={{ width: '100%', maxWidth: '380px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 900 }}>
                                {isNewCaregiver ? 'Add Caregiver to Care Team' : 'Customize Caregiver Profile'}
                            </h3>
                            <button onClick={() => setCaregiverModalTarget(null)} className="btn-ghost" style={{ padding: '6px' }}>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCaregiver} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>Avatar Emoji</label>
                                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                    {['👩', '👨', '🧑', '👵', '👴', '🦸‍♀️', '🦸‍♂️', '❤️'].map(em => (
                                        <button
                                            type="button"
                                            key={em}
                                            onClick={() => setCgEmoji(em)}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                fontSize: '18px',
                                                borderRadius: '8px',
                                                border: cgEmoji === em ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                                                background: cgEmoji === em ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {em}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>Caregiver Name</label>
                                <input
                                    type="text"
                                    value={cgName}
                                    onChange={(e) => setCgName(e.target.value)}
                                    placeholder="e.g. Mom, Dad, Grandma"
                                    className="input-field"
                                    style={{ marginTop: '4px' }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>Care Role</label>
                                <input
                                    type="text"
                                    value={cgRole}
                                    onChange={(e) => setCgRole(e.target.value)}
                                    placeholder="e.g. Primary, Care Partner, Night Nurse"
                                    className="input-field"
                                    style={{ marginTop: '4px' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                {!isNewCaregiver && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteCaregiver}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '1px solid rgba(239, 68, 68, 0.25)',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: caregivers.length <= 1 ? 'not-allowed' : 'pointer',
                                            opacity: caregivers.length <= 1 ? 0.5 : 1
                                        }}
                                        title={caregivers.length <= 1 ? 'At least 1 caregiver is required' : 'Remove this caregiver'}
                                    >
                                        Remove Caregiver
                                    </button>
                                )}
                                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                    <button type="button" onClick={() => setCaregiverModalTarget(null)} className="btn-ghost">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        <Check size={14} />
                                        <span>{isNewCaregiver ? 'Add Caregiver' : 'Save Caregiver'}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
