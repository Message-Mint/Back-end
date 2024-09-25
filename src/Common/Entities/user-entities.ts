import { SubscriptionTier, UserRole } from '@prisma/client';

export interface UserEntity {
    id: string;
    username: string;
    email: string;
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
    nickname?: string;
    isActive: boolean;
    currentSubscription: SubscriptionTier;
    registeredAt: Date;
    lastLogin?: Date | null;
    subscriptionStartDate: Date;  // Changed from subscriptionActiveAt
    subscriptionEndDate?: Date | null;  // Changed from subscriptionExpiresAt
    role: UserRole;

    // Relationships
    emailVerification?: UserVerificationEntity | null;
    phoneVerification?: UserVerificationEntity | null;
}

export interface UserVerificationEntity {
    id: bigint;
    code: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    createdAt: Date;
    expiresAt: Date;

    // Relationships
    userEmail?: UserEntity | null;
    userPhone?: UserEntity | null;
    userEmailId?: string | null;
    userPhoneId?: string | null;
}
