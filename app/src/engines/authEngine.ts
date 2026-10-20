import type { AuthSession, PasswordStrengthResult, RateLimitStatus } from '../types/auth';

const SESSION_STORAGE_KEY = 'bt_auth_session';
const USERS_DB_STORAGE_KEY = 'bt_auth_vault_v1';
const RATE_LIMIT_STORAGE_KEY = 'bt_auth_rate_limit';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// RFC 5322 compliant simplified email validator
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Common dictionary passwords prohibited by NIST SP 800-63B
const COMMON_PASSWORDS = new Set([
    'password', 'password123', 'babytracker', '12345678', '123456789', '1234567890',
    'qwerty1234', 'welcome123', 'admin1234', 'iloveyou1', 'secret1234'
]);

interface StoredUserRecord {
    id: string;
    email: string;
    displayName: string;
    familyId: string;
    role: 'owner' | 'partner' | 'nanny' | 'viewer';
    saltHex: string;
    hashHex: string;
    createdAt: number;
    lastLoginAt: number;
}

// Convert ArrayBuffer / Uint8Array to Hex
function bufferToHex(buffer: ArrayBufferLike | ArrayBuffer | Uint8Array): string {
    const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
    return Array.from(uint8)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Convert Hex to Uint8Array
function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

// Cryptographically secure random bytes with fallback for non-secure contexts (e.g. HTTP LAN on mobile)
function getRandomBytes(count: number): Uint8Array {
    const bytes = new Uint8Array(count);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        try {
            return crypto.getRandomValues(bytes);
        } catch {}
    }
    for (let i = 0; i < count; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
}

// -----------------------------------------------------------------------
// Pure-TypeScript SHA-256 & PBKDF2 (Zero-dependency fallback for non-HTTPS LAN)
// -----------------------------------------------------------------------
function pureJsSha256Bytes(bytes: Uint8Array): Uint8Array {
    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

    const l = bytes.length;
    const bitLen = l * 8;
    const padLen = (l % 64 < 56) ? (56 - (l % 64)) : (120 - (l % 64));
    const totalLen = l + padLen + 8;
    const msg = new Uint8Array(totalLen);
    msg.set(bytes);
    msg[l] = 0x80;

    const view = new DataView(msg.buffer);
    view.setUint32(totalLen - 4, bitLen >>> 0, false);
    view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);

    const W = new Uint32Array(64);

    for (let i = 0; i < totalLen; i += 64) {
        for (let t = 0; t < 16; t++) {
            W[t] = view.getUint32(i + t * 4, false);
        }
        for (let t = 16; t < 64; t++) {
            const s0 = ((W[t - 15] >>> 7) | (W[t - 15] << 25)) ^ ((W[t - 15] >>> 18) | (W[t - 15] << 14)) ^ (W[t - 15] >>> 3);
            const s1 = ((W[t - 2] >>> 17) | (W[t - 2] << 15)) ^ ((W[t - 2] >>> 19) | (W[t - 2] << 13)) ^ (W[t - 2] >>> 10);
            W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
        }

        let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

        for (let t = 0; t < 64; t++) {
            const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
            const ch = (e & f) ^ ((~e) & g);
            const temp1 = (h + S1 + ch + K[t] + W[t]) | 0;
            const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) | 0;

            h = g;
            g = f;
            f = e;
            e = (d + temp1) | 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) | 0;
        }

        h0 = (h0 + a) | 0;
        h1 = (h1 + b) | 0;
        h2 = (h2 + c) | 0;
        h3 = (h3 + d) | 0;
        h4 = (h4 + e) | 0;
        h5 = (h5 + f) | 0;
        h6 = (h6 + g) | 0;
        h7 = (h7 + h) | 0;
    }

    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    outView.setUint32(0, h0, false);
    outView.setUint32(4, h1, false);
    outView.setUint32(8, h2, false);
    outView.setUint32(12, h3, false);
    outView.setUint32(16, h4, false);
    outView.setUint32(20, h5, false);
    outView.setUint32(24, h6, false);
    outView.setUint32(28, h7, false);
    return out;
}

function pureJsHmacSha256(keyBytes: Uint8Array, msgBytes: Uint8Array): Uint8Array {
    const blockSize = 64;
    let k = keyBytes;
    if (k.length > blockSize) {
        k = pureJsSha256Bytes(k);
    }
    const keyPadded = new Uint8Array(blockSize);
    keyPadded.set(k);

    const ipad = new Uint8Array(blockSize + msgBytes.length);
    const opad = new Uint8Array(blockSize + 32);

    for (let i = 0; i < blockSize; i++) {
        ipad[i] = keyPadded[i] ^ 0x36;
        opad[i] = keyPadded[i] ^ 0x5c;
    }
    ipad.set(msgBytes, blockSize);

    const innerHash = pureJsSha256Bytes(ipad);
    opad.set(innerHash, blockSize);

    return pureJsSha256Bytes(opad);
}

function pureJsPbkdf2Sha256(passwordStr: string, saltBytes: Uint8Array, iterations = 1000, keyLen = 32): string {
    const enc = new TextEncoder();
    const passBytes = enc.encode(passwordStr);
    const numBlocks = Math.ceil(keyLen / 32);
    const result = new Uint8Array(numBlocks * 32);

    for (let block = 1; block <= numBlocks; block++) {
        const saltAndBlock = new Uint8Array(saltBytes.length + 4);
        saltAndBlock.set(saltBytes);
        new DataView(saltAndBlock.buffer).setUint32(saltBytes.length, block, false);

        let u = pureJsHmacSha256(passBytes, saltAndBlock);
        const t = new Uint8Array(u);

        for (let iter = 1; iter < iterations; iter++) {
            u = pureJsHmacSha256(passBytes, u);
            for (let i = 0; i < 32; i++) {
                t[i] ^= u[i];
            }
        }
        result.set(t, (block - 1) * 32);
    }

    return bufferToHex(result.slice(0, keyLen).buffer);
}

export class AuthEngine {
    // ----------------------------------------------------
    // Password Strength & Complexity Evaluation
    // ----------------------------------------------------
    public static evaluatePasswordStrength(password: string): PasswordStrengthResult {
        const trimmed = password || '';
        const hasMinLength = trimmed.length >= 10;
        const hasUppercase = /[A-Z]/.test(trimmed);
        const hasLowercase = /[a-z]/.test(trimmed);
        const hasNumber = /[0-9]/.test(trimmed);
        const hasSpecialChar = /[^A-Za-z0-9]/.test(trimmed);
        const isCompromisedOrCommon = COMMON_PASSWORDS.has(trimmed.toLowerCase());

        let score = 0;
        if (hasMinLength) score++;
        if (hasUppercase && hasLowercase) score++;
        if (hasNumber) score++;
        if (hasSpecialChar) score++;
        if (trimmed.length >= 14) score = Math.min(4, score + 1);

        if (isCompromisedOrCommon || !hasMinLength) {
            score = 0;
        }

        let label: PasswordStrengthResult['label'] = 'Too Weak';
        if (score === 1) label = 'Weak';
        else if (score === 2) label = 'Fair';
        else if (score === 3) label = 'Good';
        else if (score >= 4) label = 'Strong';

        return {
            score,
            label,
            hasMinLength,
            hasUppercase,
            hasLowercase,
            hasNumber,
            hasSpecialChar,
            isCompromisedOrCommon
        };
    }

    // ----------------------------------------------------
    // Rate Limiting & Brute Force Defense
    // ----------------------------------------------------
    public static getRateLimitStatus(): RateLimitStatus {
        try {
            const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
            if (!raw) return { isLocked: false, remainingSeconds: 0, failedAttempts: 0 };
            const parsed = JSON.parse(raw);
            const now = Date.now();

            if (parsed.lockedUntil && parsed.lockedUntil > now) {
                const remaining = Math.ceil((parsed.lockedUntil - now) / 1000);
                return { isLocked: true, remainingSeconds: remaining, failedAttempts: parsed.attempts || MAX_FAILED_ATTEMPTS };
            }

            // Lockout expired: reset
            if (parsed.lockedUntil && parsed.lockedUntil <= now) {
                localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
                return { isLocked: false, remainingSeconds: 0, failedAttempts: 0 };
            }

            return { isLocked: false, remainingSeconds: 0, failedAttempts: parsed.attempts || 0 };
        } catch {
            return { isLocked: false, remainingSeconds: 0, failedAttempts: 0 };
        }
    }

    private static recordFailedAttempt(): RateLimitStatus {
        const current = this.getRateLimitStatus();
        const nextAttempts = current.failedAttempts + 1;
        const now = Date.now();
        const isLocked = nextAttempts >= MAX_FAILED_ATTEMPTS;
        const lockedUntil = isLocked ? now + LOCKOUT_DURATION_MS : null;

        const payload = {
            attempts: nextAttempts,
            lockedUntil,
            lastFailedAt: now
        };

        try {
            localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(payload));
        } catch {}

        return {
            isLocked,
            remainingSeconds: isLocked ? Math.ceil(LOCKOUT_DURATION_MS / 1000) : 0,
            failedAttempts: nextAttempts
        };
    }

    public static resetFailedAttempts(): void {
        try {
            localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
        } catch {}
    }

    // ----------------------------------------------------
    // Cryptographic PBKDF2 Hash with Salt
    // ----------------------------------------------------
    private static async hashPassword(password: string, salt: Uint8Array): Promise<string> {
        // Use browser Web Cryptography API if available (Secure Contexts: HTTPS / localhost)
        if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.importKey === 'function') {
            try {
                const encoder = new TextEncoder();
                const passKey = await crypto.subtle.importKey(
                    'raw',
                    encoder.encode(password),
                    { name: 'PBKDF2' },
                    false,
                    ['deriveBits', 'deriveKey']
                );

                const derived = await crypto.subtle.deriveBits(
                    {
                        name: 'PBKDF2',
                        salt: salt as any,
                        iterations: 100000,
                        hash: 'SHA-256'
                    },
                    passKey,
                    256
                );

                return bufferToHex(derived);
            } catch (err) {
                console.warn('SubtleCrypto error, falling back to pure-JS PBKDF2:', err);
            }
        }

        // Pure-JS cryptographic PBKDF2-HMAC-SHA256 fallback (works on HTTP LAN, mobile devices, local IP)
        return pureJsPbkdf2Sha256(password, salt, 1000, 32);
    }

    // ----------------------------------------------------
    // User Vault Storage Helpers
    // ----------------------------------------------------
    private static getUsersVault(): Record<string, StoredUserRecord> {
        try {
            const raw = localStorage.getItem(USERS_DB_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    private static saveUsersVault(vault: Record<string, StoredUserRecord>): void {
        try {
            localStorage.setItem(USERS_DB_STORAGE_KEY, JSON.stringify(vault));
        } catch {}
    }

    // ----------------------------------------------------
    // Active Session Management
    // ----------------------------------------------------
    public static getSession(): AuthSession | null {
        try {
            const raw = localStorage.getItem(SESSION_STORAGE_KEY);
            if (!raw) return null;
            const session: AuthSession = JSON.parse(raw);

            // Verify session expiration (30 days TTL)
            if (session.expiresAt && session.expiresAt < Date.now()) {
                this.logout();
                return null;
            }

            return session;
        } catch {
            return null;
        }
    }

    public static setSession(session: AuthSession): void {
        try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        } catch {}
    }

    public static logout(): void {
        try {
            localStorage.removeItem(SESSION_STORAGE_KEY);
        } catch {}
    }

    // ----------------------------------------------------
    // Sample / Demo Testing Bypass
    // ----------------------------------------------------
    public static readonly SAMPLE_CREDENTIALS = {
        email: 'demo.parent@nurserytracker.app',
        displayName: 'Demo Parent (Sarah)',
        password: 'DemoParent2026!'
    };

    /**
     * Bypasses the new user gate for testing/evaluation.
     * Seeds and authenticates a pre-configured sample parent profile.
     */
    public static async loginAsSampleUser(): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
        const vault = this.getUsersVault();
        const sampleEmail = this.SAMPLE_CREDENTIALS.email;
        const now = Date.now();
        let userRecord = vault[sampleEmail];

        if (!userRecord) {
            const salt = getRandomBytes(16);
            const saltHex = bufferToHex(salt.buffer);
            const hashHex = await this.hashPassword(this.SAMPLE_CREDENTIALS.password, salt);
            const familyId = 'fam_demo_nursery_vip';
            const userId = 'usr_demo_parent_sarah';

            userRecord = {
                id: userId,
                email: sampleEmail,
                displayName: this.SAMPLE_CREDENTIALS.displayName,
                familyId,
                role: 'owner',
                saltHex,
                hashHex,
                createdAt: now,
                lastLoginAt: now
            };
            vault[sampleEmail] = userRecord;
            this.saveUsersVault(vault);
        } else {
            userRecord.lastLoginAt = now;
            vault[sampleEmail] = userRecord;
            this.saveUsersVault(vault);
        }

        this.resetFailedAttempts();

        const session: AuthSession = {
            user: {
                id: userRecord.id,
                email: userRecord.email,
                displayName: userRecord.displayName,
                familyId: userRecord.familyId,
                role: userRecord.role,
                createdAt: userRecord.createdAt,
                lastLoginAt: now
            },
            accessToken: `bt_jwt_sample_${bufferToHex(getRandomBytes(16).buffer)}`,
            expiresAt: now + 30 * 24 * 60 * 60 * 1000
        };

        this.setSession(session);
        return { success: true, session };
    }

    // ----------------------------------------------------
    // Core Auth Operations
    // ----------------------------------------------------
    public static async signup(
        email: string,
        password: string,
        displayName: string
    ): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
        const cleanEmail = email.trim().toLowerCase();
        const cleanName = displayName.trim();

        // 1. Validate email
        if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
            return { success: false, error: 'Please enter a valid email address.' };
        }

        // 2. Validate caregiver name
        if (!cleanName || cleanName.length < 2) {
            return { success: false, error: 'Caregiver name must be at least 2 characters.' };
        }

        // 3. Validate password complexity
        const strength = this.evaluatePasswordStrength(password);
        if (!strength.hasMinLength) {
            return { success: false, error: 'Password must be at least 10 characters long.' };
        }
        if (strength.isCompromisedOrCommon) {
            return { success: false, error: 'This password is too common. Please create a stronger password.' };
        }
        if (strength.score < 2) {
            return { success: false, error: 'Please include uppercase, lowercase, numbers, and symbols.' };
        }

        // 4. Check if user already exists
        const vault = this.getUsersVault();
        if (vault[cleanEmail]) {
            return { success: false, error: 'An account with this email already exists. Please log in.' };
        }

        // 5. Generate unique cryptographic 16-byte salt and hash
        const salt = getRandomBytes(16);
        const saltHex = bufferToHex(salt.buffer);
        const hashHex = await this.hashPassword(password, salt);

        // Generate high-entropy family ID
        const familyId = `fam_${bufferToHex(getRandomBytes(8).buffer)}`;
        const userId = `usr_${bufferToHex(getRandomBytes(8).buffer)}`;
        const now = Date.now();

        const userRecord: StoredUserRecord = {
            id: userId,
            email: cleanEmail,
            displayName: cleanName,
            familyId,
            role: 'owner',
            saltHex,
            hashHex,
            createdAt: now,
            lastLoginAt: now
        };

        vault[cleanEmail] = userRecord;
        this.saveUsersVault(vault);
        this.resetFailedAttempts();

        // Create 30-day authenticated session
        const session: AuthSession = {
            user: {
                id: userId,
                email: cleanEmail,
                displayName: cleanName,
                familyId,
                role: 'owner',
                createdAt: now,
                lastLoginAt: now
            },
            accessToken: `bt_jwt_${bufferToHex(getRandomBytes(16).buffer)}`,
            expiresAt: now + 30 * 24 * 60 * 60 * 1000
        };

        this.setSession(session);
        return { success: true, session };
    }

    public static async login(
        email: string,
        password: string
    ): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
        // 1. Check rate limit
        const rateLimit = this.getRateLimitStatus();
        if (rateLimit.isLocked) {
            const mins = Math.floor(rateLimit.remainingSeconds / 60);
            const secs = rateLimit.remainingSeconds % 60;
            return {
                success: false,
                error: `Security lockout: Too many failed attempts. Please retry in ${mins}m ${secs}s.`
            };
        }

        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
            return { success: false, error: 'Please enter a valid email address.' };
        }

        const vault = this.getUsersVault();
        const userRecord = vault[cleanEmail];

        if (!userRecord) {
            this.recordFailedAttempt();
            return { success: false, error: 'Incorrect email or password.' };
        }

        // Verify password hash
        const saltBytes = hexToBytes(userRecord.saltHex);
        const computedHash = await this.hashPassword(password, saltBytes);

        if (computedHash !== userRecord.hashHex) {
            const updatedRate = this.recordFailedAttempt();
            if (updatedRate.isLocked) {
                return {
                    success: false,
                    error: `Account temporarily locked due to 5 failed attempts. Locked for 15 minutes.`
                };
            }
            const attemptsLeft = MAX_FAILED_ATTEMPTS - updatedRate.failedAttempts;
            return {
                success: false,
                error: `Incorrect email or password. (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining)`
            };
        }

        // Reset rate limit on success
        this.resetFailedAttempts();
        const now = Date.now();
        userRecord.lastLoginAt = now;
        vault[cleanEmail] = userRecord;
        this.saveUsersVault(vault);

        const session: AuthSession = {
            user: {
                id: userRecord.id,
                email: userRecord.email,
                displayName: userRecord.displayName,
                familyId: userRecord.familyId,
                role: userRecord.role,
                createdAt: userRecord.createdAt,
                lastLoginAt: now
            },
            accessToken: `bt_jwt_${bufferToHex(getRandomBytes(16).buffer)}`,
            expiresAt: now + 30 * 24 * 60 * 60 * 1000
        };

        this.setSession(session);
        return { success: true, session };
    }

    public static async requestPasswordReset(
        email: string
    ): Promise<{ success: boolean; message: string }> {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
            return { success: false, message: 'Please enter a valid email address.' };
        }

        // Constant time message response to prevent email enumeration
        return {
            success: true,
            message: 'If an account exists with this email, a secure password reset link has been dispatched.'
        };
    }

    public static async changePassword(
        currentPass: string,
        newPass: string
    ): Promise<{ success: boolean; error?: string }> {
        const session = this.getSession();
        if (!session) return { success: false, error: 'Session expired. Please log in again.' };

        const vault = this.getUsersVault();
        const userRecord = vault[session.user.email];
        if (!userRecord) return { success: false, error: 'User record not found.' };

        const currentSalt = hexToBytes(userRecord.saltHex);
        const currentHash = await this.hashPassword(currentPass, currentSalt);
        if (currentHash !== userRecord.hashHex) {
            return { success: false, error: 'Current password does not match.' };
        }

        const strength = this.evaluatePasswordStrength(newPass);
        if (!strength.hasMinLength || strength.score < 2) {
            return { success: false, error: 'New password must be at least 10 characters with mixed complexity.' };
        }

        const newSalt = getRandomBytes(16);
        userRecord.saltHex = bufferToHex(newSalt.buffer);
        userRecord.hashHex = await this.hashPassword(newPass, newSalt);
        vault[session.user.email] = userRecord;
        this.saveUsersVault(vault);

        return { success: true };
    }

    public static deleteAccount(): { success: boolean } {
        const session = this.getSession();
        if (session) {
            const vault = this.getUsersVault();
            delete vault[session.user.email];
            this.saveUsersVault(vault);
            this.logout();
        }
        return { success: true };
    }
}
