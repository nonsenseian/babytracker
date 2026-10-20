import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SoundEngine } from '../../engines/soundMachine';
import { VoiceAssistant } from '../../engines/voiceEngine';
import { Settings as SettingsIcon, Volume2, Mic, Sliders, Layout, X, RotateCcw, ArrowUp, ArrowDown, Eye, EyeOff, ShieldCheck, Mail, KeyRound, LogOut, Trash2, AlertCircle, Check, Download, FileText, Database, Copy } from 'lucide-react';

interface SettingsModalProps {
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const { settings, updateSettings, activeChild, children, logs, allLogs, caregivers, appointments, unit, authSession, logout, changePassword, deleteAccount } = useApp();

    // Data Export & Backup State
    const [exportFeedback, setExportFeedback] = useState<string | null>(null);

    const generateTextExport = () => {
        const targetLogs = allLogs && allLogs.length > 0 ? allLogs : logs;
        const lines: string[] = [];
        lines.push(`====================================================`);
        lines.push(`👶 NOVABABY ACTIVITY & HEALTH RECORD EXPORT`);
        lines.push(`Generated: ${new Date().toLocaleString()}`);
        lines.push(`====================================================\n`);

        lines.push(`CHILD PROFILE:`);
        lines.push(`- Name: ${activeChild.name || 'Baby'}`);
        lines.push(`- Birth Date: ${activeChild.birthDate || 'Not specified'}`);
        if (activeChild.gender) lines.push(`- Gender: ${activeChild.gender}`);
        if (activeChild.allergies) lines.push(`- Allergies: ${activeChild.allergies}`);
        if (activeChild.bloodType) lines.push(`- Blood Type: ${activeChild.bloodType}`);
        if (activeChild.pediatrician) lines.push(`- Pediatrician: ${activeChild.pediatrician}`);
        if (activeChild.clinic) lines.push(`- Clinic: ${activeChild.clinic}`);
        lines.push(`\nSUMMARY:`);
        lines.push(`- Total Logged Events: ${targetLogs.length}`);

        // Group logs by date
        const logsByDate = new Map<string, typeof targetLogs>();
        const sortedLogs = [...targetLogs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        sortedLogs.forEach(l => {
            const dateKey = l.dateStr || new Date(l.timestamp || Date.now()).toISOString().split('T')[0];
            if (!logsByDate.has(dateKey)) logsByDate.set(dateKey, []);
            logsByDate.get(dateKey)!.push(l);
        });

        lines.push(`- Active Days Logged: ${logsByDate.size} days\n`);
        lines.push(`====================================================`);
        lines.push(`ACTIVITY HISTORY:`);
        lines.push(`====================================================\n`);

        logsByDate.forEach((dayLogs, dateStr) => {
            lines.push(`📅 DATE: ${dateStr}`);
            dayLogs.forEach(log => {
                const timeStr = new Date(log.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                let details = '';
                if (log.category === 'feeding' || (log.category as string) === 'nursing') {
                    const vol = log.amountMl ? `${log.amountMl} mL` : '';
                    const dur = log.durationMinutes ? `${log.durationMinutes}m` : '';
                    const type = log.subType ? `[${log.subType.toUpperCase()}]` : '[FEED]';
                    details = `${type} ${vol} ${dur}`.trim();
                } else if (log.category === 'diaper') {
                    details = `[DIAPER] Type: ${log.subType || 'change'}`;
                } else if (log.category === 'sleep') {
                    details = `[SLEEP] ${log.durationMinutes || 0}m ${log.isNightSleep ? '(Night Sleep)' : '(Nap)'}`;
                } else if (log.category === 'pumping') {
                    details = `[PUMP] ${log.amountMl || 0} mL (${log.durationMinutes || 0}m)`;
                } else if (log.category === 'tummy') {
                    details = `[TUMMY TIME] ${log.durationMinutes || 0}m`;
                } else if (log.category === 'health' || (log.category as string) === 'medication') {
                    details = `[HEALTH] ${log.medicationName || log.subType || 'entry'} ${log.dosage || ''}`.trim();
                } else if (log.category === 'bath') {
                    details = `[BATH] Bath session`;
                } else if (log.category === 'growth') {
                    details = `[GROWTH] ${log.weightLbs ? `${log.weightLbs}lbs ` : ''}${log.weightOz ? `${log.weightOz}oz ` : ''}${log.heightInches ? `${log.heightInches}in` : ''}`.trim() || 'Growth entry';
                } else if (log.category === 'solids') {
                    details = `[SOLIDS] ${log.subType || 'Solid food entry'}`;
                } else if ((log.category as string) === 'vitals') {
                    details = `[VITALS] Temp: ${log.temperature ? `${log.temperature}°` : 'N/A'}`;
                } else if (log.category === 'milestone') {
                    details = `[MILESTONE] ${log.milestoneTitle || log.notes || 'Milestone achieved'}`;
                } else {
                    details = `[${log.category.toUpperCase()}]`;
                }

                const notePart = log.notes ? ` • Note: "${log.notes}"` : '';
                lines.push(`  • ${timeStr} - ${details}${notePart}`);
            });
            lines.push('');
        });

        if (appointments && appointments.length > 0) {
            lines.push(`====================================================`);
            lines.push(`APPOINTMENTS:`);
            lines.push(`====================================================`);
            appointments.forEach(a => {
                lines.push(`- ${a.date} ${a.time || ''}: ${a.title} (${a.doctorName || 'Doctor'}) - ${a.location || ''} ${a.notes ? `[${a.notes}]` : ''}`.trim());
            });
            lines.push('');
        }

        return lines.join('\n');
    };

    const downloadFile = (content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportText = () => {
        const text = generateTextExport();
        const safeName = (activeChild.name || 'baby').toLowerCase().replace(/[^a-z0-9]/g, '-');
        const dateStr = new Date().toISOString().split('T')[0];
        downloadFile(text, `novababy-${safeName}-notes-${dateStr}.txt`, 'text/plain;charset=utf-8');
        setExportFeedback('Exported text summary file (.txt)!');
        setTimeout(() => setExportFeedback(null), 3500);
    };

    const handleCopyText = async () => {
        const text = generateTextExport();
        try {
            await navigator.clipboard.writeText(text);
            setExportFeedback('Copied full activity summary to clipboard!');
            setTimeout(() => setExportFeedback(null), 3500);
        } catch (e) {
            setExportFeedback('Unable to auto-copy; download the .txt file instead.');
            setTimeout(() => setExportFeedback(null), 3500);
        }
    };

    const handleExportJson = () => {
        const targetLogs = allLogs && allLogs.length > 0 ? allLogs : logs;
        const backupData = {
            exportVersion: '1.0.0',
            appName: 'NovaBaby',
            exportTimestamp: new Date().toISOString(),
            activeChild,
            allChildren: children,
            logs: targetLogs,
            caregivers,
            appointments,
            settings
        };
        const safeName = (activeChild.name || 'baby').toLowerCase().replace(/[^a-z0-9]/g, '-');
        const dateStr = new Date().toISOString().split('T')[0];
        downloadFile(JSON.stringify(backupData, null, 2), `novababy-${safeName}-backup-${dateStr}.json`, 'application/json');
        setExportFeedback('Exported full database backup (.json)!');
        setTimeout(() => setExportFeedback(null), 3500);
    };

    // Account & Password Management State
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmNewPass, setConfirmNewPass] = useState('');
    const [passChangeError, setPassChangeError] = useState<string | null>(null);
    const [passChangeSuccess, setPassChangeSuccess] = useState<string | null>(null);
    const [isChangingPass, setIsChangingPass] = useState(false);

    const handleChangePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassChangeError(null);
        setPassChangeSuccess(null);
        if (newPass.length < 10) {
            setPassChangeError('New password must be at least 10 characters.');
            return;
        }
        if (newPass !== confirmNewPass) {
            setPassChangeError('New passwords do not match.');
            return;
        }
        setIsChangingPass(true);
        try {
            const res = await changePassword(currentPass, newPass);
            if (res.success) {
                setPassChangeSuccess('Password successfully updated!');
                setCurrentPass('');
                setNewPass('');
                setConfirmNewPass('');
                setTimeout(() => {
                    setIsChangePasswordOpen(false);
                    setPassChangeSuccess(null);
                }, 1400);
            } else {
                setPassChangeError(res.error || 'Failed to update password.');
            }
        } catch (err: any) {
            setPassChangeError(err.message || 'Error changing password.');
        } finally {
            setIsChangingPass(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to log out of your family account?')) {
            logout();
            onClose();
        }
    };

    const handleDeleteAccount = () => {
        if (window.confirm('⚠️ DANGER: Are you sure you want to delete your family account and purge all local child records? This action cannot be reversed.')) {
            deleteAccount();
            onClose();
        }
    };

    const testVoiceReminder = () => {
        SoundEngine.playChime('reminder');
        setTimeout(() => {
            VoiceAssistant.speak(`Friendly reminder: It's time to feed ${activeChild.name}!`);
        }, 400);
    };

    const testPumpReminder = () => {
        SoundEngine.playChime('reminder');
        setTimeout(() => {
            VoiceAssistant.speak('Friendly reminder: Time for your scheduled pumping session.');
        }, 400);
    };

    const testChimeOnly = () => {
        SoundEngine.playChime('reminder');
    };

    const allSections = [
        { id: 'sweet-nap', label: '💤 Nap Predictor' },
        { id: 'timeline-ribbon', label: '⏱️ 24-Hour Day Ribbon' },
        { id: 'quick-logging', label: '⚡ Quick Log' },
        { id: 'timers', label: '⏱️ Live Timers' },
        { id: 'sound-machine', label: '🎶 Sound Machine' },
        { id: 'activity-log', label: '📜 Activity History' }
    ];

    const currentOrder = settings.sectionOrder && settings.sectionOrder.length > 0
        ? settings.sectionOrder
        : allSections.map(s => s.id);

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
        const newOrder = [...currentOrder];
        const temp = newOrder[index];
        newOrder[index] = newOrder[targetIndex];
        newOrder[targetIndex] = temp;
        updateSettings({ sectionOrder: newOrder });
    };

    const toggleSectionVisibility = (sectionId: string) => {
        const hidden = settings.hiddenSections || [];
        const isCurrentlyHidden = hidden.includes(sectionId);
        const newHidden = isCurrentlyHidden
            ? hidden.filter(id => id !== sectionId)
            : [...hidden, sectionId];
        updateSettings({ hiddenSections: newHidden });
    };

    const resetLayout = () => {
        updateSettings({
            sectionOrder: ['reminders', 'quick-logging', 'timers', 'sound-machine', 'activity-log'],
            hiddenSections: [],
            isLayoutEditMode: false
        });
    };

    return (
        <div
            id="settings-modal"
            className="modal-backdrop"
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '16px'
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
        >
            <div
                className="surface-card"
                style={{
                    width: '100%',
                    maxWidth: '560px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--primary-accent)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <SettingsIcon size={20} />
                        </div>
                        <div>
                            <h2 id="settings-modal-title" style={{ fontSize: '18px', fontWeight: 800 }}>
                                App Settings & Customization
                            </h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Account security, category defaults & layout personalization
                            </p>
                        </div>
                    </div>
                    <button
                        id="settings-modal-close-btn"
                        onClick={onClose}
                        className="btn-ghost"
                        style={{ padding: '6px' }}
                        aria-label="Close Settings modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Section 0: Family Account & Security */}
                <div
                    id="account-security-card"
                    style={{
                        padding: '16px',
                        borderRadius: '14px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-color)',
                        marginBottom: '16px'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#10b981'
                            }}>
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                                    Family Account & Security
                                </h3>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                    Authenticated credentials, session security & account controls
                                </p>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#10b981',
                            fontSize: '11px',
                            fontWeight: 800
                        }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                            <span>Active 30-Day Session</span>
                        </div>
                    </div>

                    {/* Account Details Badges */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '10px',
                        marginTop: '12px'
                    }}>
                        <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                Authenticated Email
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <Mail size={14} style={{ color: 'var(--primary-accent)' }} />
                                <span id="account-display-email" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                                    {authSession?.user?.email || 'Authenticated User'}
                                </span>
                            </div>
                        </div>

                        <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                Caregiver Name & Role
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <span style={{ fontSize: '14px' }}>🧑‍🍼</span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {authSession?.user?.displayName || 'Primary Caregiver'}
                                </span>
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    padding: '2px 5px',
                                    borderRadius: '5px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                    color: '#d97706',
                                    textTransform: 'uppercase'
                                }}>
                                    {authSession?.user?.role || 'Owner'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Change Password Expander / Form */}
                    {isChangePasswordOpen && (
                        <div style={{
                            marginTop: '12px',
                            padding: '14px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 800, margin: 0 }}>Change Family Password</h4>
                                <button type="button" onClick={() => setIsChangePasswordOpen(false)} className="btn-ghost" style={{ padding: '4px' }}>
                                    <X size={14} />
                                </button>
                            </div>

                            {passChangeError && (
                                <div style={{
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#ef4444',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    marginBottom: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <AlertCircle size={13} style={{ flexShrink: 0 }} />
                                    <span>{passChangeError}</span>
                                </div>
                            )}

                            {passChangeSuccess && (
                                <div style={{
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    color: '#10b981',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    marginBottom: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <Check size={13} style={{ flexShrink: 0 }} />
                                    <span>{passChangeSuccess}</span>
                                </div>
                            )}

                            <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Current Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={currentPass}
                                        onChange={(e) => setCurrentPass(e.target.value)}
                                        placeholder="Current password"
                                        className="input-field"
                                        style={{ width: '100%', marginTop: '3px', fontSize: '12px', padding: '6px 10px' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>New Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={newPass}
                                            onChange={(e) => setNewPass(e.target.value)}
                                            placeholder="Min 10 characters"
                                            className="input-field"
                                            style={{ width: '100%', marginTop: '3px', fontSize: '12px', padding: '6px 10px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Confirm New Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={confirmNewPass}
                                            onChange={(e) => setConfirmNewPass(e.target.value)}
                                            placeholder="Confirm password"
                                            className="input-field"
                                            style={{ width: '100%', marginTop: '3px', fontSize: '12px', padding: '6px 10px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                                    <button type="button" onClick={() => setIsChangePasswordOpen(false)} className="btn-ghost" style={{ fontSize: '12px', padding: '6px 12px' }}>
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isChangingPass} className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }}>
                                        {isChangingPass ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Account Controls Toolbar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                id="btn-account-change-password"
                                onClick={() => {
                                    setIsChangePasswordOpen(!isChangePasswordOpen);
                                    setPassChangeError(null);
                                    setPassChangeSuccess(null);
                                }}
                                className="btn-ghost"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '11.5px',
                                    fontWeight: 800,
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                <KeyRound size={13} style={{ color: 'var(--primary-accent)' }} />
                                <span>Change Password</span>
                            </button>

                            <button
                                type="button"
                                id="btn-account-logout"
                                onClick={handleLogout}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    fontSize: '11.5px',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                }}
                            >
                                <LogOut size={13} />
                                <span>Log Out</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            id="btn-account-delete"
                            onClick={handleDeleteAccount}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                color: '#ef4444',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer'
                            }}
                            title="Permanently remove your account and purge records"
                        >
                            <Trash2 size={12} />
                            <span>Delete Account</span>
                        </button>
                    </div>
                </div>

                {/* Section 1: Voice & Chime Reminders */}
                <div style={{
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Volume2 size={18} style={{ color: 'var(--primary-accent)' }} />
                        <h3 style={{ fontSize: '14px', fontWeight: 800 }}>
                            Voice & Reminder Chimes
                        </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700 }}>Realistic Spoken Voice Reminders</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Speaks gentle maternal voice notification when feedings or pumps are due
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.voiceReminders}
                                onChange={(e) => updateSettings({ voiceReminders: e.target.checked })}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-accent)' }}
                            />
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700 }}>Audio Chime Sound</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Plays harmonic ding-dong chime on alert due times
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.reminderChimes}
                                onChange={(e) => updateSettings({ reminderChimes: e.target.checked })}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-accent)' }}
                            />
                        </label>

                        {/* Test Reminder Buttons */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                            <button
                                onClick={testVoiceReminder}
                                className="btn-ghost"
                                style={{
                                    fontSize: '12px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Mic size={14} style={{ color: '#f43f5e' }} />
                                <span>Test Voice Feed Reminder</span>
                            </button>

                            <button
                                onClick={testPumpReminder}
                                className="btn-ghost"
                                style={{
                                    fontSize: '12px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Mic size={14} style={{ color: '#9333ea' }} />
                                <span>Test Voice Pump Reminder</span>
                            </button>

                            <button
                                onClick={testChimeOnly}
                                className="btn-ghost"
                                style={{
                                    fontSize: '12px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Volume2 size={14} style={{ color: '#10b981' }} />
                                <span>Test Chime</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section 2: Category Default Values */}
                <div style={{
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Sliders size={18} style={{ color: '#38bdf8' }} />
                        <h3 style={{ fontSize: '14px', fontWeight: 800 }}>
                            Category Default Values
                        </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                        {/* Feed Volume Default */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                Default Feed Volume ({unit})
                            </label>
                            <input
                                type="number"
                                min={10}
                                max={500}
                                step={5}
                                value={settings.defaultFeedVolume}
                                onChange={(e) => updateSettings({ defaultFeedVolume: parseInt(e.target.value) || 60 })}
                                className="input-field"
                                style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Pre-fills formula & bottle quick logging
                            </span>
                        </div>

                        {/* Default Feed Type */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                Default Feed Type
                            </label>
                            <select
                                value={settings.defaultFeedType}
                                onChange={(e) => updateSettings({ defaultFeedType: e.target.value as any })}
                                className="input-field"
                                style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                            >
                                <option value="formula">Formula Bottle</option>
                                <option value="breastmilk">Breastmilk Bottle</option>
                                <option value="nursing">Nursing Session</option>
                            </select>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Primary nutritional source
                            </span>
                        </div>

                        {/* Default Pump Amount */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                Default Pump Yield ({unit})
                            </label>
                            <input
                                type="number"
                                min={10}
                                max={500}
                                step={10}
                                value={settings.defaultPumpAmount}
                                onChange={(e) => updateSettings({ defaultPumpAmount: parseInt(e.target.value) || 100 })}
                                className="input-field"
                                style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Standard pumped yield
                            </span>
                        </div>

                        {/* Nap Target Minutes */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                Default Nap Target (min)
                            </label>
                            <input
                                type="number"
                                min={15}
                                max={240}
                                step={15}
                                value={settings.defaultNapMinutes}
                                onChange={(e) => updateSettings({ defaultNapMinutes: parseInt(e.target.value) || 60 })}
                                className="input-field"
                                style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Preset sleep timer target
                            </span>
                        </div>

                        {/* Feed Reminder Interval (hours) */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                Feed Reminder Interval (hrs)
                            </label>
                            <input
                                id="settings-feed-interval-input"
                                type="number"
                                min={1}
                                max={12}
                                step={0.5}
                                value={settings.feedIntervalHours || 3.0}
                                onChange={(e) => updateSettings({ feedIntervalHours: parseFloat(e.target.value) || 3.0 })}
                                className="input-field"
                                style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Default: 3h (anchored to feed start)
                            </span>
                        </div>

                        {/* Pump Reminder Interval (hours) */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                Pump Reminder Interval (hrs)
                            </label>
                            <input
                                id="settings-pump-interval-input"
                                type="number"
                                min={1}
                                max={12}
                                step={0.5}
                                value={settings.pumpIntervalHours || 3.0}
                                onChange={(e) => updateSettings({ pumpIntervalHours: parseFloat(e.target.value) || 3.0 })}
                                className="input-field"
                                style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Default: 3h between sessions
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section 3: Customize Dashboard Layout */}
                <div style={{
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layout size={18} style={{ color: '#f59e0b' }} />
                            <h3 style={{ fontSize: '14px', fontWeight: 800 }}>
                                Customize Dashboard Layout
                            </h3>
                        </div>
                        <button
                            onClick={resetLayout}
                            className="btn-ghost"
                            style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Reset all sections to default arrangement"
                        >
                            <RotateCcw size={12} />
                            <span>Reset Order</span>
                        </button>
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                        Reorder sections, hide unneeded blocks, or customize directly on the dashboard.
                    </p>

                    {/* Layout Edit Mode Toggle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: settings.isLayoutEditMode ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
                        border: settings.isLayoutEditMode ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                        marginBottom: '14px'
                    }}>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: settings.isLayoutEditMode ? '#f59e0b' : 'var(--text-primary)' }}>
                                {settings.isLayoutEditMode ? '🛠️ Dashboard Edit Mode Active' : 'Edit on Dashboard'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Rearrange cards and remove sections directly on the dashboard
                            </div>
                        </div>
                        <button
                            id="settings-toggle-layout-mode-btn"
                            onClick={() => {
                                if (!settings.isLayoutEditMode) {
                                    updateSettings({ isLayoutEditMode: true });
                                    onClose();
                                } else {
                                    updateSettings({ isLayoutEditMode: false });
                                }
                            }}
                            className={settings.isLayoutEditMode ? 'btn-primary' : 'btn-ghost'}
                            style={{
                                fontSize: '12px',
                                padding: '6px 14px',
                                backgroundColor: settings.isLayoutEditMode ? '#f59e0b' : undefined,
                                borderColor: settings.isLayoutEditMode ? '#f59e0b' : undefined
                            }}
                        >
                            {settings.isLayoutEditMode ? 'Exit Edit' : 'Customize'}
                        </button>
                    </div>

                    {/* Section Order & Visibility List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {currentOrder.map((sectionId, index) => {
                            const info = allSections.find(s => s.id === sectionId);
                            if (!info) return null;
                            const isHidden = (settings.hiddenSections || []).includes(sectionId);

                            return (
                                <div
                                    key={sectionId}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        backgroundColor: 'var(--bg-surface)',
                                        border: '1px solid var(--border-color)',
                                        opacity: isHidden ? 0.6 : 1
                                    }}
                                >
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {info.label} {isHidden && <span style={{ fontSize: '11px', color: '#ef4444' }}>(Hidden)</span>}
                                    </span>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {/* Reorder Buttons */}
                                        <button
                                            onClick={() => moveSection(index, 'up')}
                                            disabled={index === 0}
                                            aria-label={`Move ${info.label} up`}
                                            style={{
                                                padding: '4px 6px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-color)',
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                                opacity: index === 0 ? 0.3 : 1
                                            }}
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            onClick={() => moveSection(index, 'down')}
                                            disabled={index === currentOrder.length - 1}
                                            aria-label={`Move ${info.label} down`}
                                            style={{
                                                padding: '4px 6px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-color)',
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                cursor: index === currentOrder.length - 1 ? 'not-allowed' : 'pointer',
                                                opacity: index === currentOrder.length - 1 ? 0.3 : 1
                                            }}
                                        >
                                            <ArrowDown size={14} />
                                        </button>

                                        {/* Toggle Visibility */}
                                        <button
                                            onClick={() => toggleSectionVisibility(sectionId)}
                                            aria-label={isHidden ? `Show ${info.label}` : `Hide ${info.label}`}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-color)',
                                                background: isHidden ? '#ef444415' : 'transparent',
                                                color: isHidden ? '#ef4444' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '11px',
                                                fontWeight: 700
                                            }}
                                        >
                                            {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                                            <span>{isHidden ? 'Hidden' : 'Visible'}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Data Export & Universal Backup Section */}
                <div id="settings-data-export-section" className="surface-elevated" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Download size={18} color="var(--primary-accent)" />
                        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Data Export & Universal Backup</h3>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
                        Export your complete activity history, health milestones, appointments, and settings. Choose readable text for Apple Notes and LLMs (ChatGPT/Claude/Gemini), or JSON for cross-device backup and account migration.
                    </p>

                    {exportFeedback && (
                        <div style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: 'rgba(22, 163, 74, 0.12)',
                            color: '#16a34a',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '12px'
                        }}>
                            <Check size={14} />
                            <span>{exportFeedback}</span>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {/* Option 1: Formatted Text */}
                        <div style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-surface)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '10px'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <FileText size={15} color="var(--primary-accent)" />
                                    <span style={{ fontSize: '13px', fontWeight: 800 }}>Notes / LLM Text</span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                                    Chronological activity feed. Perfect for Apple Notes, pediatric visits, or AI chat analysis.
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    id="btn-export-text"
                                    onClick={handleExportText}
                                    style={{
                                        flex: 1,
                                        padding: '7px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--primary-accent)',
                                        background: 'transparent',
                                        color: 'var(--primary-accent)',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <Download size={12} />
                                    <span>.TXT File</span>
                                </button>
                                <button
                                    id="btn-copy-export-text"
                                    onClick={handleCopyText}
                                    title="Copy text summary to clipboard"
                                    style={{
                                        padding: '7px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color)',
                                        background: 'transparent',
                                        color: 'var(--text-secondary)',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Copy size={12} />
                                </button>
                            </div>
                        </div>

                        {/* Option 2: JSON Backup */}
                        <div style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-surface)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '10px'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <Database size={15} color="var(--primary-accent)" />
                                    <span style={{ fontSize: '13px', fontWeight: 800 }}>Full JSON Backup</span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                                    Complete raw database export. Easy to import onto new devices or feed into custom tools.
                                </div>
                            </div>
                            <button
                                id="btn-export-json"
                                onClick={handleExportJson}
                                style={{
                                    width: '100%',
                                    padding: '7px 8px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: 'var(--primary-accent)',
                                    color: '#fff',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px'
                                }}
                            >
                                <Download size={12} />
                                <span>.JSON Backup</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        onClick={onClose}
                        className="btn-primary"
                        style={{ width: '100%', padding: '11px', fontSize: '14px' }}
                    >
                        Save & Close Settings
                    </button>
                </div>
            </div>
        </div>
    );
};
