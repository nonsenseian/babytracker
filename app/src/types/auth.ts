export type UserRole = 'owner' | 'partner' | 'nanny' | 'viewer';

export interface UserAccount {
    id: string;
    email: string;
    displayName: string;
    familyId: string;
    role: UserRole;
    createdAt: number;
    lastLoginAt: number;
}

export interface AuthSession {
    user: UserAccount;
    accessToken: string;
    expiresAt: number;
}

export interface PasswordStrengthResult {
    score: number; // 0 to 4
    label: 'Too Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    isCompromisedOrCommon: boolean;
}

export interface RateLimitStatus {
    isLocked: boolean;
    remainingSeconds: number;
    failedAttempts: number;
}
