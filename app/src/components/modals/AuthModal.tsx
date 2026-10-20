import React, { useState, useEffect } from 'react';
import { AuthEngine } from '../../engines/authEngine';
import type { AuthSession, PasswordStrengthResult } from '../../types/auth';
import { Shield, Lock, Mail, User, Eye, EyeOff, Check, AlertCircle, ArrowRight, KeyRound, Zap } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onAuthenticated: (session: AuthSession) => void;
}

type AuthMode = 'signup' | 'login' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onAuthenticated }) => {
    const [mode, setMode] = useState<AuthMode>('signup');

    // Form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // States & Feedback
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [strength, setStrength] = useState<PasswordStrengthResult>(() => AuthEngine.evaluatePasswordStrength(''));
    const [rateLimit, setRateLimit] = useState(AuthEngine.getRateLimitStatus());

    // Update password strength live
    useEffect(() => {
        setStrength(AuthEngine.evaluatePasswordStrength(password));
    }, [password]);

    // Tick countdown timer if locked out
    useEffect(() => {
        if (!rateLimit.isLocked) return;
        const interval = setInterval(() => {
            const status = AuthEngine.getRateLimitStatus();
            setRateLimit(status);
        }, 1000);
        return () => clearInterval(interval);
    }, [rateLimit.isLocked]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setInfoMessage(null);

        if (rateLimit.isLocked) {
            setError(`Account temporarily locked. Please wait ${rateLimit.remainingSeconds}s.`);
            return;
        }

        setIsLoading(true);

        try {
            if (mode === 'signup') {
                if (password !== confirmPassword) {
                    setError('Passwords do not match. Please re-enter.');
                    setIsLoading(false);
                    return;
                }

                const res = await AuthEngine.signup(email, password, displayName);
                if (res.success && res.session) {
                    onAuthenticated(res.session);
                } else {
                    setError(res.error || 'Failed to create account.');
                }
            } else if (mode === 'login') {
                const res = await AuthEngine.login(email, password);
                if (res.success && res.session) {
                    onAuthenticated(res.session);
                } else {
                    setError(res.error || 'Invalid credentials.');
                    setRateLimit(AuthEngine.getRateLimitStatus());
                }
            } else if (mode === 'forgot') {
                const res = await AuthEngine.requestPasswordReset(email);
                setInfoMessage(res.message);
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected authentication error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSampleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await AuthEngine.loginAsSampleUser();
            if (res.success && res.session) {
                onAuthenticated(res.session);
            } else {
                setError(res.error || 'Failed to sign in with sample account.');
            }
        } catch (err: any) {
            setError(err.message || 'Sample authentication error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutofillSample = () => {
        if (mode === 'signup') {
            setDisplayName(AuthEngine.SAMPLE_CREDENTIALS.displayName);
            setEmail(AuthEngine.SAMPLE_CREDENTIALS.email);
            setPassword(AuthEngine.SAMPLE_CREDENTIALS.password);
            setConfirmPassword(AuthEngine.SAMPLE_CREDENTIALS.password);
        } else {
            setEmail(AuthEngine.SAMPLE_CREDENTIALS.email);
            setPassword(AuthEngine.SAMPLE_CREDENTIALS.password);
        }
        setError(null);
    };

    return (
        <div
            id="auth-onboarding-modal"
            role="dialog"
            aria-modal="true"
            aria-label="NovaBaby Account Authentication"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10000,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                overflowY: 'auto'
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '24px',
                    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                    padding: '24px 22px',
                    boxSizing: 'border-box',
                    color: 'var(--text-primary)'
                }}
            >
                {/* Brand Header */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        fontSize: '28px',
                        marginBottom: '10px'
                    }}>
                        👶
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
                        NovaBaby
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                        Pediatric Health Tracking & Family Caregiver Sync
                    </p>
                    <button
                        type="button"
                        id="btn-quick-sample-bypass-top"
                        onClick={handleSampleSignIn}
                        disabled={isLoading}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '20px',
                            backgroundColor: 'rgba(245, 158, 11, 0.12)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            color: '#f59e0b',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <Zap size={14} />
                        <span>Instant Sample Sign-In (Bypass)</span>
                    </button>
                </div>

                {/* Mode Segmented Controls */}
                {mode !== 'forgot' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        padding: '4px',
                        borderRadius: '14px',
                        marginBottom: '20px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <button
                            type="button"
                            id="btn-auth-tab-signup"
                            onClick={() => { setMode('signup'); setError(null); }}
                            style={{
                                padding: '10px 0',
                                border: 'none',
                                borderRadius: '10px',
                                backgroundColor: mode === 'signup' ? 'var(--primary-accent)' : 'transparent',
                                color: mode === 'signup' ? '#ffffff' : 'var(--text-muted)',
                                fontWeight: 800,
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            Create Account
                        </button>
                        <button
                            type="button"
                            id="btn-auth-tab-login"
                            onClick={() => { setMode('login'); setError(null); }}
                            style={{
                                padding: '10px 0',
                                border: 'none',
                                borderRadius: '10px',
                                backgroundColor: mode === 'login' ? 'var(--primary-accent)' : 'transparent',
                                color: mode === 'login' ? '#ffffff' : 'var(--text-muted)',
                                fontWeight: 800,
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            Sign In
                        </button>
                    </div>
                )}

                {/* Rate Limit Security Lockout Banner */}
                {rateLimit.isLocked && (
                    <div style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        border: '1.5px solid #ef4444',
                        color: '#ef4444',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <div>
                            Security lockout: Too many failed attempts. Locked for {Math.floor(rateLimit.remainingSeconds / 60)}m {rateLimit.remainingSeconds % 60}s.
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        fontSize: '12px',
                        fontWeight: 700,
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Info Message Banner */}
                {infoMessage && (
                    <div style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        fontSize: '12px',
                        fontWeight: 700,
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Check size={16} style={{ flexShrink: 0 }} />
                        <span>{infoMessage}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Caregiver Name (Sign Up only) */}
                    {mode === 'signup' && (
                        <div>
                            <label htmlFor="auth-input-name" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                                Caregiver Name or Nickname
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <User size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                                <input
                                    id="auth-input-name"
                                    type="text"
                                    required
                                    placeholder="e.g. Mama Sarah or Dad Alex"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    autoComplete="name"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px 12px 36px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-surface-elevated)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Email Input */}
                    <div>
                        <label htmlFor="auth-input-email" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                            Email Address
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                            <input
                                id="auth-input-email"
                                type="email"
                                required
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                inputMode="email"
                                style={{
                                    width: '100%',
                                    padding: '12px 14px 12px 36px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-surface-elevated)',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Password Input (Sign up and Log in only) */}
                    {mode !== 'forgot' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                                <label htmlFor="auth-input-password" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                    Password
                                </label>
                                {mode === 'login' && (
                                    <button
                                        type="button"
                                        id="btn-auth-to-forgot"
                                        onClick={() => { setMode('forgot'); setError(null); }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            color: 'var(--primary-accent)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                                <input
                                    id="auth-input-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder={mode === 'signup' ? 'Min 10 characters with symbols' : 'Enter your password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                    style={{
                                        width: '100%',
                                        padding: '12px 42px 12px 36px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-surface-elevated)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* Password Strength Meter (Sign Up Only) */}
                            {mode === 'signup' && password.length > 0 && (
                                <div style={{ marginTop: '8px' }}>
                                    {/* 4-tier strength bar */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', height: '4px', marginBottom: '6px' }}>
                                        {[1, 2, 3, 4].map((step) => {
                                            const isActive = strength.score >= step;
                                            const color = strength.score === 1
                                                ? '#ef4444'
                                                : strength.score === 2
                                                ? '#f59e0b'
                                                : strength.score === 3
                                                ? '#3b82f6'
                                                : '#10b981';
                                            return (
                                                <div
                                                    key={step}
                                                    style={{
                                                        borderRadius: '2px',
                                                        backgroundColor: isActive ? color : 'var(--border-color)',
                                                        transition: 'background-color 0.2s ease'
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Strength label & criteria */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        <span>
                                            Strength:{' '}
                                            <strong style={{
                                                color: strength.score <= 1 ? '#ef4444' : strength.score === 2 ? '#f59e0b' : '#10b981'
                                            }}>
                                                {strength.label}
                                            </strong>
                                        </span>
                                        <span>
                                            {strength.hasMinLength ? '✓ 10+ chars' : '10+ chars needed'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Confirm Password Input (Sign Up Only) */}
                    {mode === 'signup' && (
                        <div>
                            <label htmlFor="auth-input-confirm-password" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                                Confirm Password
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <KeyRound size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                                <input
                                    id="auth-input-confirm-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Re-enter your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px 12px 36px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-surface-elevated)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        id="btn-auth-submit"
                        disabled={isLoading || rateLimit.isLocked}
                        style={{
                            minHeight: '48px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--primary-accent)',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 800,
                            cursor: (isLoading || rateLimit.isLocked) ? 'not-allowed' : 'pointer',
                            opacity: (isLoading || rateLimit.isLocked) ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginTop: '8px',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {isLoading ? (
                            <span>Verifying...</span>
                        ) : mode === 'signup' ? (
                            <>
                                <span>Create Family Account</span>
                                <ArrowRight size={16} />
                            </>
                        ) : mode === 'login' ? (
                            <>
                                <span>Sign In to Account</span>
                                <ArrowRight size={16} />
                            </>
                        ) : (
                            <span>Send Recovery Link</span>
                        )}
                    </button>

                    {/* Back to Sign In Link (Forgot Mode) */}
                    {mode === 'forgot' && (
                        <button
                            type="button"
                            onClick={() => { setMode('login'); setError(null); setInfoMessage(null); }}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '8px',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                textAlign: 'center'
                            }}
                        >
                            ← Back to Sign In
                        </button>
                    )}
                </form>

                {/* Sample Account Bypass Card */}
                <div
                    id="sample-signin-bypass-card"
                    style={{
                        marginTop: '16px',
                        padding: '12px 14px',
                        borderRadius: '14px',
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        border: '1.5px dashed rgba(245, 158, 11, 0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        textAlign: 'center'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#f59e0b' }}>
                        <Zap size={14} />
                        <span>Quick Testing Bypass</span>
                    </div>
                    <button
                        type="button"
                        id="btn-sample-signin-bypass"
                        disabled={isLoading}
                        onClick={handleSampleSignIn}
                        style={{
                            minHeight: '44px',
                            width: '100%',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(245, 158, 11, 0.16)',
                            border: '1.5px solid #f59e0b',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <span>⚡ One-Tap Sample Sign-In</span>
                        <ArrowRight size={14} style={{ color: '#f59e0b' }} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>demo.parent@nurserytracker.app</span>
                        <span>•</span>
                        <button
                            type="button"
                            id="btn-autofill-sample"
                            onClick={handleAutofillSample}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                color: 'var(--primary-accent)',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Autofill Form
                        </button>
                    </div>
                </div>

                {/* Security Trust Badge */}
                <div style={{
                    marginTop: '22px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    textAlign: 'center'
                }}>
                    <Shield size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span>End-to-End Encrypted • HIPAA-aligned Privacy • COPPA Compliant</span>
                </div>
            </div>
        </div>
    );
};
