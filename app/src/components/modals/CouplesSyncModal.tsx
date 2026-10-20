import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../../context/AppContext';
import { syncService } from '../../engines/syncEngine';
import { X, Copy, Check, Users, Wifi, Send } from 'lucide-react';

interface CouplesSyncModalProps {
    onClose: () => void;
}

export const CouplesSyncModal: React.FC<CouplesSyncModalProps> = ({ onClose }) => {
    const { roomId, setRoomId, activeChild, logs, caregivers, appointments } = useApp();

    const [copied, setCopied] = useState(false);
    const [joinRoomInput, setJoinRoomInput] = useState('');
    const [isEditingRoom, setIsEditingRoom] = useState(false);
    const [partnerConnected, setPartnerConnected] = useState(false);
    const [pingStatus, setPingStatus] = useState<string | null>(null);
    const [transferCode, setTransferCode] = useState<string | null>(null);
    const [importCodeInput, setImportCodeInput] = useState('');
    const [importMsg, setImportMsg] = useState<string | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string>('');

    const partnerUrl = syncService.getPartnerInviteUrl();

    useEffect(() => {
        if (!partnerUrl) return;
        let isMounted = true;
        QRCode.toDataURL(partnerUrl, {
            width: 240,
            margin: 2,
            color: {
                dark: '#0f172a',
                light: '#ffffff'
            },
            errorCorrectionLevel: 'M'
        }).then(url => {
            if (isMounted) setQrDataUrl(url);
        }).catch(err => {
            console.error('Failed to generate QR code:', err);
        });
        return () => { isMounted = false; };
    }, [partnerUrl]);

    useEffect(() => {
        const unsub = syncService.onPartnerPing(() => {
            setPartnerConnected(true);
            setPingStatus('Partner confirmed handshake! 🤝 Connected in real-time.');
            setTimeout(() => setPingStatus(null), 4000);
        });
        return () => unsub();
    }, []);

    const handleCopyInviteLink = () => {
        if (!partnerUrl) return;
        navigator.clipboard.writeText(partnerUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinRoomInput.trim()) return;
        setRoomId(joinRoomInput.trim());
        setIsEditingRoom(false);
        setPingStatus(`Joined room: ${joinRoomInput.trim()}`);
        setTimeout(() => setPingStatus(null), 3000);
    };

    const handleSendTestPing = () => {
        setPingStatus('Sending test ping to partner devices...');
        syncService.broadcastPing();
        setTimeout(() => {
            if (!partnerConnected) {
                setPingStatus('Ping broadcasted to local channel & cloud relay topic.');
            }
        }, 1200);
    };

    const handleGenerateTransferCode = () => {
        const data = {
            logs,
            caregivers,
            appointments,
            activeChildId: activeChild.id
        };
        const code = syncService.generateTransferCode(data);
        setTransferCode(code);
    };

    const handleImportTransferCode = () => {
        if (!importCodeInput.trim()) return;
        const imported = syncService.importTransferCode(importCodeInput.trim());
        if (imported) {
            setImportMsg('Successfully imported household state from partner code! ✨');
            setTimeout(() => {
                setImportMsg(null);
                onClose();
            }, 1800);
        } else {
            setImportMsg('Invalid transfer code. Please verify and try again.');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            padding: '16px'
        }}>
            <div className="surface-card" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Users size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0 }}>
                                Couples & Care Partners Shared Access
                            </h3>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                Shared household access across partners & devices
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Explanation Banner */}
                <div style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    color: 'var(--text-primary)',
                    marginBottom: '16px'
                }}>
                    <strong style={{ color: '#0284c7' }}>How Shared Couples Accounts Work:</strong>
                    <br />
                    NovaBaby provides a single shared Family Household Room. When your partner opens your invite link or scans the QR code, both phones share the same baby profiles, live countdown timers, activity logs, and doctor appointments in real-time.
                </div>

                {/* Room ID & Live Status */}
                <div style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            Family Household Room Code
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981' }}>Live Sync Active</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary-accent)' }}>
                            {roomId}
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsEditingRoom(!isEditingRoom)}
                            style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: 'var(--text-secondary)',
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            {isEditingRoom ? 'Cancel' : 'Change / Join Room'}
                        </button>
                    </div>

                    {isEditingRoom && (
                        <form onSubmit={handleJoinRoom} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                            <input
                                type="text"
                                value={joinRoomInput}
                                onChange={(e) => setJoinRoomInput(e.target.value)}
                                placeholder="Enter partner's room ID"
                                className="input-field"
                                style={{ flex: 1, fontSize: '12px' }}
                                required
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                Join
                            </button>
                        </form>
                    )}
                </div>

                {/* 1-Tap Partner Invite Link */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>
                        Partner One-Tap Invite Link
                    </label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <input
                            type="text"
                            readOnly
                            value={partnerUrl}
                            className="input-field"
                            style={{ flex: 1, fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}
                        />
                        <button
                            type="button"
                            onClick={handleCopyInviteLink}
                            className="btn-primary"
                            style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
                        </button>
                    </div>
                </div>

                {/* QR Code Card for Partner Phone */}
                <div style={{
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    marginBottom: '16px'
                }}>
                    <div style={{
                        width: '140px',
                        height: '140px',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        {qrDataUrl ? (
                            <img
                                src={qrDataUrl}
                                alt={`QR code for room ${roomId}`}
                                id="partner-qr-image"
                                style={{ width: '124px', height: '124px', objectFit: 'contain' }}
                            />
                        ) : (
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Generating QR...</span>
                        )}
                    </div>

                    <span style={{ fontSize: '12px', fontWeight: 800, marginTop: '8px' }}>
                        Scan With Partner's Phone Camera
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Instant pairing without typing passwords or downloading accounts
                    </span>
                </div>

                {/* Handshake Ping & Live Diagnostic */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    marginBottom: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wifi size={16} style={{ color: partnerConnected ? '#10b981' : 'var(--text-muted)' }} />
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>
                            {partnerConnected ? 'Partner Device Connected' : 'Waiting for Partner Handshake'}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleSendTestPing}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'transparent',
                            color: 'var(--primary-accent)',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <Send size={11} />
                        <span>Send Test Ping</span>
                    </button>
                </div>

                {pingStatus && (
                    <div style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid #10b981',
                        color: '#10b981',
                        fontSize: '11px',
                        fontWeight: 700,
                        marginBottom: '16px'
                    }}>
                        {pingStatus}
                    </div>
                )}

                {/* Transfer Bundle / Backup Section */}
                <div style={{
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>
                            Offline Backup & Transfer Code
                        </span>
                        <button
                            type="button"
                            onClick={handleGenerateTransferCode}
                            style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: 'var(--primary-accent)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Generate Code
                        </button>
                    </div>

                    {transferCode && (
                        <div>
                            <textarea
                                readOnly
                                value={transferCode}
                                rows={2}
                                className="input-field"
                                style={{ fontSize: '10px', fontFamily: 'monospace', width: '100%' }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(transferCode);
                                    alert('Transfer code copied to clipboard!');
                                }}
                                style={{
                                    marginTop: '4px',
                                    fontSize: '11px',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-surface-elevated)',
                                    border: '1px solid var(--border-color)',
                                    cursor: 'pointer'
                                }}
                            >
                                Copy Code
                            </button>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={importCodeInput}
                            onChange={(e) => setImportCodeInput(e.target.value)}
                            placeholder="Paste partner's transfer code to import"
                            className="input-field"
                            style={{ flex: 1, fontSize: '11px' }}
                        />
                        <button
                            type="button"
                            onClick={handleImportTransferCode}
                            className="btn-ghost"
                            style={{ fontSize: '11px', padding: '6px 12px', whiteSpace: 'nowrap' }}
                        >
                            Import
                        </button>
                    </div>

                    {importMsg && (
                        <div style={{ fontSize: '11px', fontWeight: 700, color: importMsg.includes('Success') ? '#10b981' : '#ef4444' }}>
                            {importMsg}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button type="button" onClick={onClose} className="btn-primary" style={{ padding: '8px 20px' }}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
