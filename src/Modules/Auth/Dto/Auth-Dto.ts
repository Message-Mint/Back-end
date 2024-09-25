import { IsString, IsEmail, IsNumber } from "class-validator";
import { SubscriptionTier, UserRole } from '@prisma/client';
export class UserRegistrationDto {
    @IsString()
    userName: string;

    @IsEmail()
    emailAddress: string;

    @IsNumber()
    phoneNumber: string;

    @IsString()
    password: string;

    @IsString()
    firstName?: string;

    @IsString()
    lastName?: string;

    @IsString()
    nickName?: string;
}


export class UserLoginDto {
    @IsString()
    userName?: string;

    @IsEmail()
    emailAddress?: string;

    @IsString()
    password: string;
}

export class forgotPasswordDto {
    @IsString()
    username: string;

    @IsString()
    oldPassword: string;

    @IsString()
    newPassword: string;
}

export interface JwtPayload {
    userId: string;
    username: string;
    email: string;
    role: UserRole;
    subscription: SubscriptionTier;
    firstName: string;
    lastName: string;
    isActive: boolean;
    subscriptionStartDate: Date;
    subscriptionEndDate: Date | null;
}