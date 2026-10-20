import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ChildProfile } from '../../types/profile';
import { X, Check, Trash2 } from 'lucide-react';

interface ChildProfileModalProps {
    childToEdit?: ChildProfile | null;
    onClose: () => void;
}

export const ChildProfileModal: React.FC<ChildProfileModalProps> = ({ childToEdit, onClose }) => {
    const { activeChild, children, saveChild, deleteChild, setActiveChildId } = useApp();

    const isNew = childToEdit === null;
    const target = isNew ? null : (childToEdit || activeChild);

    const [name, setName] = useState(target ? target.name : '');
    const [birthDate, setBirthDate] = useState(target ? target.birthDate : new Date().toISOString().split('T')[0]);
    const [gender, setGender] = useState<'boy' | 'girl' | 'other'>(target?.gender === 'girl' ? 'girl' : 'boy');
    const [avatarEmoji, setAvatarEmoji] = useState(target?.avatarEmoji || '👶');
    const [weightLbs, setWeightLbs] = useState(target?.birthWeightLbs ? `${target.birthWeightLbs}` : '');
    const [weightOz, setWeightOz] = useState(target?.birthWeightOz ? `${target.birthWeightOz}` : '');
    const [currentWeight, setCurrentWeight] = useState(target?.currentWeight || (target?.birthWeightLbs ? `${target.birthWeightLbs} lbs ${target.birthWeightOz || 0} oz` : '9 lbs 4 oz'));
    const [heightInches, setHeightInches] = useState(target?.birthHeightInches ? `${target.birthHeightInches}` : '');
    const [pediatrician, setPediatrician] = useState(target?.pediatrician || '');
    const [allergies, setAllergies] = useState(target?.allergies || '');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const emojis = ['👶', '🍼', '🐣', '⭐', '🧸', '🌈', '🦁', '🐻'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isNew && children.length >= 6) {
            setErrorMsg('Pro tier cap reached: Maximum 6 children allowed.');
            return;
        }

        const childId = target ? target.id : `child_${Date.now()}`;
        const updated: ChildProfile = {
            ...(target || {}),
            id: childId,
            name: name.trim() || (isNew ? 'New Sibling' : 'Baby'),
            birthDate,
            gender,
            avatarEmoji,
            birthWeightLbs: weightLbs ? parseFloat(weightLbs) : undefined,
            birthWeightOz: weightOz ? parseFloat(weightOz) : undefined,
            currentWeight: currentWeight.trim() || undefined,
            birthHeightInches: heightInches ? parseFloat(heightInches) : undefined,
            pediatrician: pediatrician.trim(),
            allergies: allergies.trim() || undefined
        };

        const res = saveChild(updated);
        if (!res.success) {
            setErrorMsg(res.error || 'Failed to save child profile');
            return;
        }
        if (isNew) {
            setActiveChildId(updated.id);
        }
        onClose();
    };

    return (
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
            <div className="surface-card" style={{ width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Child Profile & Birth Vitals</h3>
                    <button id="child-profile-modal-close-btn" onClick={onClose} className="btn-ghost" style={{ padding: '6px' }} aria-label="Close child profile modal">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Emoji Avatar Selector */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Avatar Emoji</label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                            {emojis.map(em => (
                                <button
                                    type="button"
                                    key={em}
                                    onClick={() => setAvatarEmoji(em)}
                                    style={{
                                        width: '38px',
                                        height: '38px',
                                        fontSize: '20px',
                                        borderRadius: '8px',
                                        border: avatarEmoji === em ? '2px solid var(--primary-accent)' : '1px solid var(--border-color)',
                                        background: avatarEmoji === em ? 'var(--badge-bg)' : 'transparent',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Baby Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Leo, Maya"
                            className="input-field"
                            style={{ marginTop: '4px' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Date of Birth</label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="input-field"
                                style={{ marginTop: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Gender</label>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value as any)}
                                className="input-field"
                                style={{ marginTop: '4px' }}
                            >
                                <option value="boy">Boy</option>
                                <option value="girl">Girl</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Birth Vitals */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Birth Weight (Lbs)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={weightLbs}
                                onChange={(e) => setWeightLbs(e.target.value)}
                                placeholder="e.g. 7"
                                className="input-field"
                                style={{ marginTop: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Birth Weight (Oz)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={weightOz}
                                onChange={(e) => setWeightOz(e.target.value)}
                                placeholder="e.g. 8"
                                className="input-field"
                                style={{ marginTop: '4px' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Current Weight</label>
                        <input
                            type="text"
                            value={currentWeight}
                            onChange={(e) => setCurrentWeight(e.target.value)}
                            placeholder="e.g. 9 lbs 4 oz"
                            className="input-field"
                            style={{ marginTop: '4px' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Birth Length (Inches)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={heightInches}
                            onChange={(e) => setHeightInches(e.target.value)}
                            placeholder="e.g. 20.5"
                            className="input-field"
                            style={{ marginTop: '4px' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Primary Pediatrician</label>
                        <input
                            type="text"
                            value={pediatrician}
                            onChange={(e) => setPediatrician(e.target.value)}
                            placeholder="e.g. Dr. Sarah Smith, MD"
                            className="input-field"
                            style={{ marginTop: '4px' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Allergies & Sensitivities</label>
                        <input
                            type="text"
                            id="child-profile-allergies-input"
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            placeholder="e.g. Cow's milk protein, Penicillin, None known"
                            className="input-field"
                            style={{ marginTop: '4px' }}
                        />
                    </div>

                    {errorMsg && (
                        <div style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid #ef4444',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: 700
                        }}>
                            {errorMsg}
                        </div>
                    )}

                    {isNew && children.length >= 6 && (
                        <div style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid #f59e0b',
                            color: '#f59e0b',
                            fontSize: '12px',
                            fontWeight: 700
                        }}>
                            ⚠️ Pro Tier Cap Reached: Maximum of 6 children supported.
                        </div>
                    )}

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        marginTop: '14px',
                        paddingTop: '14px',
                        borderTop: '1px solid var(--border-color)'
                    }}>
                        {!isNew && target && (
                            <button
                                type="button"
                                disabled={children.length <= 1}
                                title={children.length <= 1 ? 'Cannot remove the only child profile' : 'Remove this child profile'}
                                onClick={() => {
                                    if (children.length <= 1) {
                                        alert('Cannot remove the only child profile. At least 1 child profile is required.');
                                        return;
                                    }
                                    if (window.confirm(`Are you sure you want to remove ${target.name}'s profile? All logged care entries for this child will be removed.`)) {
                                        deleteChild(target.id);
                                        onClose();
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #ef4444',
                                    backgroundColor: 'transparent',
                                    color: '#ef4444',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: children.length <= 1 ? 'not-allowed' : 'pointer',
                                    opacity: children.length <= 1 ? 0.4 : 1
                                }}
                            >
                                <Trash2 size={14} />
                                <span>Remove Child</span>
                            </button>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                            <button type="button" onClick={onClose} className="btn-ghost">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isNew && children.length >= 6}
                                className="btn-primary"
                                style={{
                                    opacity: (isNew && children.length >= 6) ? 0.5 : 1,
                                    cursor: (isNew && children.length >= 6) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <Check size={16} />
                                <span>Save Profile</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
