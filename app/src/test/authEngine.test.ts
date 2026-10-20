import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthEngine } from '../engines/authEngine';

describe('AuthEngine - Security & Cryptographic Evaluation', () => {
    beforeEach(() => {
        localStorage.clear();
        AuthEngine.resetFailedAttempts();
    });

    describe('NIST SP 800-63B Password Complexity Scoring', () => {
        it('rejects passwords shorter than 10 characters', () => {
            const res = AuthEngine.evaluatePasswordStrength('Short1!');
            expect(res.hasMinLength).toBe(false);
            expect(res.score).toBeLessThanOrEqual(1);
            expect(res.label).toBe('Too Weak');
        });

        it('rejects common dictionary passwords regardless of length', () => {
            const res = AuthEngine.evaluatePasswordStrength('password123');
            expect(res.isCompromisedOrCommon).toBe(true);
            expect(res.score).toBeLessThanOrEqual(1);
        });

        it('scores high complexity passwords with mixed case, numbers, and symbols', () => {
            const res = AuthEngine.evaluatePasswordStrength('NurserySecure#2026');
            expect(res.hasMinLength).toBe(true);
            expect(res.hasUppercase).toBe(true);
            expect(res.hasLowercase).toBe(true);
            expect(res.hasNumber).toBe(true);
            expect(res.hasSpecialChar).toBe(true);
            expect(res.isCompromisedOrCommon).toBe(false);
            expect(res.score).toBeGreaterThanOrEqual(4);
            expect(res.label).toBe('Strong');
        });
    });

    describe('Account Creation & Authentication Workflow', () => {
        it('fails signup if email format is invalid', async () => {
            const res = await AuthEngine.signup('not-an-email', 'StrongPass#2026', 'Mom');
            expect(res.success).toBe(false);
            expect(res.error).toContain('valid email');
        });

        it('fails signup if caregiver name is too short', async () => {
            const res = await AuthEngine.signup('test@example.com', 'StrongPass#2026', 'A');
            expect(res.success).toBe(false);
            expect(res.error).toContain('at least 2 characters');
        });

        it('fails signup if password is weak', async () => {
            const res = await AuthEngine.signup('test@example.com', 'weak', 'Mom');
            expect(res.success).toBe(false);
            expect(res.error).toContain('at least 10 characters');
        });

        it('successfully creates account with cryptographic PBKDF2 hash and creates session', async () => {
            const res = await AuthEngine.signup('sarah@nursery.org', 'StrongBaby#2026!', 'Sarah');
            expect(res.success).toBe(true);
            expect(res.session).toBeDefined();
            expect(res.session?.user.email).toBe('sarah@nursery.org');
            expect(res.session?.user.displayName).toBe('Sarah');
            expect(res.session?.user.role).toBe('owner');
            expect(res.session?.user.familyId).toMatch(/^fam_/);
            expect(res.session?.accessToken).toMatch(/^bt_jwt_/);

            // Active session retrievable
            const currentSession = AuthEngine.getSession();
            expect(currentSession).not.toBeNull();
            expect(currentSession?.user.email).toBe('sarah@nursery.org');
        });

        it('prevents duplicate account creation with same email', async () => {
            await AuthEngine.signup('duplicate@nursery.org', 'StrongBaby#2026!', 'Sarah');
            const res = await AuthEngine.signup('duplicate@nursery.org', 'AnotherPass#2026!', 'Alex');
            expect(res.success).toBe(false);
            expect(res.error).toContain('already exists');
        });

        it('authenticates valid credentials and rejects invalid passwords', async () => {
            await AuthEngine.signup('parent@nursery.org', 'ValidPass#2026!', 'Parent');
            AuthEngine.logout();

            // Wrong password
            const failRes = await AuthEngine.login('parent@nursery.org', 'WrongPassword123!');
            expect(failRes.success).toBe(false);
            expect(failRes.error).toContain('Incorrect email or password');

            // Correct password
            const successRes = await AuthEngine.login('parent@nursery.org', 'ValidPass#2026!');
            expect(successRes.success).toBe(true);
            expect(successRes.session?.user.email).toBe('parent@nursery.org');
        });
    });

    describe('Rate Limiting & Lockout Protection', () => {
        it('triggers a 15-minute security lockout after 5 consecutive failed attempts', async () => {
            await AuthEngine.signup('lockout@nursery.org', 'SuperSecret#2026!', 'Mama');
            AuthEngine.logout();

            for (let i = 0; i < 4; i++) {
                const attempt = await AuthEngine.login('lockout@nursery.org', 'WrongPass!');
                expect(attempt.success).toBe(false);
            }

            const fifthAttempt = await AuthEngine.login('lockout@nursery.org', 'WrongPass!');
            expect(fifthAttempt.success).toBe(false);
            expect(fifthAttempt.error).toContain('temporarily locked');

            const status = AuthEngine.getRateLimitStatus();
            expect(status.isLocked).toBe(true);
            expect(status.remainingSeconds).toBeGreaterThan(800);

            // Even if correct password is now supplied, it remains locked
            const blockedAttempt = await AuthEngine.login('lockout@nursery.org', 'SuperSecret#2026!');
            expect(blockedAttempt.success).toBe(false);
            expect(blockedAttempt.error).toContain('Security lockout');
        });
    });

    describe('Password Update & Account Deletion', () => {
        it('allows password change when current password matches', async () => {
            await AuthEngine.signup('changer@nursery.org', 'OldSecurePass#2026!', 'Caregiver');

            // Wrong current password
            const fail = await AuthEngine.changePassword('WrongOldPass!', 'BrandNewPass#2026!');
            expect(fail.success).toBe(false);
            expect(fail.error).toContain('Current password does not match');

            // Correct password update
            const success = await AuthEngine.changePassword('OldSecurePass#2026!', 'BrandNewPass#2026!');
            expect(success.success).toBe(true);

            // Log out and verify new password works
            AuthEngine.logout();
            const loginOld = await AuthEngine.login('changer@nursery.org', 'OldSecurePass#2026!');
            expect(loginOld.success).toBe(false);

            const loginNew = await AuthEngine.login('changer@nursery.org', 'BrandNewPass#2026!');
            expect(loginNew.success).toBe(true);
        });

        it('deletes account and purges active session', async () => {
            await AuthEngine.signup('purge@nursery.org', 'PassToPurge#2026!', 'User');
            expect(AuthEngine.getSession()).not.toBeNull();

            AuthEngine.deleteAccount();
            expect(AuthEngine.getSession()).toBeNull();

            // Account is removed from vault
            const retryLogin = await AuthEngine.login('purge@nursery.org', 'PassToPurge#2026!');
            expect(retryLogin.success).toBe(false);
        });
    });

    describe('Sample / Demo Testing Bypass', () => {
        it('bypasses new user wall with pre-configured sample parent profile', async () => {
            const res = await AuthEngine.loginAsSampleUser();
            expect(res.success).toBe(true);
            expect(res.session).toBeDefined();
            expect(res.session?.user.email).toBe(AuthEngine.SAMPLE_CREDENTIALS.email);
            expect(res.session?.user.displayName).toBe(AuthEngine.SAMPLE_CREDENTIALS.displayName);
            expect(res.session?.user.role).toBe('owner');

            // Session persists in localStorage
            const activeSession = AuthEngine.getSession();
            expect(activeSession?.user.email).toBe(AuthEngine.SAMPLE_CREDENTIALS.email);
        });
    });

    describe('Non-Secure Context Fallback (HTTP LAN / Mobile without SubtleCrypto)', () => {
        const originalSubtle = window.crypto?.subtle;

        beforeEach(() => {
            // Emulate non-secure context (window.crypto.subtle is undefined on http://10.0.0.44:5173)
            Object.defineProperty(window.crypto, 'subtle', {
                value: undefined,
                configurable: true,
                writable: true
            });
        });

        afterEach(() => {
            Object.defineProperty(window.crypto, 'subtle', {
                value: originalSubtle,
                configurable: true,
                writable: true
            });
        });

        it('successfully signs up, hashes with pure-JS PBKDF2, and authenticates without SubtleCrypto', async () => {
            const res = await AuthEngine.signup('mobile.parent@nursery.org', 'MobileSecure#2026!', 'Mobile Parent');
            expect(res.success).toBe(true);
            expect(res.session).toBeDefined();
            expect(res.session?.user.email).toBe('mobile.parent@nursery.org');

            // Verify login works with pure-JS PBKDF2 hash verification
            AuthEngine.logout();
            const loginRes = await AuthEngine.login('mobile.parent@nursery.org', 'MobileSecure#2026!');
            expect(loginRes.success).toBe(true);
            expect(loginRes.session?.user.email).toBe('mobile.parent@nursery.org');
        });

        it('successfully executes 1-tap sample sign-in bypass when SubtleCrypto is undefined', async () => {
            const sampleRes = await AuthEngine.loginAsSampleUser();
            expect(sampleRes.success).toBe(true);
            expect(sampleRes.session?.user.email).toBe(AuthEngine.SAMPLE_CREDENTIALS.email);
        });
    });
});


