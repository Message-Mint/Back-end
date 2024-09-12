import { SubscriptionTier, UserType } from '@prisma/client';

export interface UserEntity {
    id: string;
    userName: string;
    emailAddress: string;
    phoneNumber: string;
    password: string;
    firstName?: string;
    lastName?: string;
    nickName?: string
    isActive?: boolean;
    currentSubscription: SubscriptionTier;
    registeredAt: Date;
    lastLogin?: Date | null;
    subscriptionActiveAt: Date;
    subscriptionExpiresAt?: Date | null;
    userType?: UserType;

    // Relationships
    emailVerification?: UserVerificationEntity | null;
    phoneVerification?: UserVerificationEntity | null;
    emailVerificationId?: bigint | null;
    phoneVerificationId?: bigint | null;
}

export interface UserVerificationEntity {
    id: bigint;
    code: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;

    // Relationships
    userEmail?: UserEntity | null;
    userPhone?: UserEntity | null;
}
