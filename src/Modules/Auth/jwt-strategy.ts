import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from './Dto/Auth-Dto';
import { UserRepository } from 'src/Common/Repositorys/user-repository';
import { SubscriptionTier, UserRole } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly userRepository: UserRepository
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                JwtStrategy.extractJWTFromCookie,
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    private static extractJWTFromCookie(req: Request): string | null {
        if (req.cookies && 'authToken' in req.cookies) {
            return req.cookies.authToken;
        }
        return null;
    }

    async validate(payload: any): Promise<JwtPayload> {
        this.validatePayloadStructure(payload);
        if (!payload || !payload.sub) {
            throw new UnauthorizedException('Invalid token payload');
        }

        const user = await this.userRepository.findUserById(payload.sub);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('User account is inactive');
        }

        const currentDate = new Date();
        if (user.subscriptionEndDate && user.subscriptionEndDate < currentDate) {
            throw new UnauthorizedException('User subscription has expired');
        }

        // Check if JWT role matches database role
        if (payload.role !== user.role) {
            throw new UnauthorizedException('User role mismatch');
        }

        const jwtPayload: JwtPayload = {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            subscription: user.currentSubscription,
            firstName: user.firstName,
            lastName: user.lastName,
            isActive: user.isActive,
            subscriptionStartDate: user.subscriptionStartDate,
            subscriptionEndDate: user.subscriptionEndDate
        };

        this.validateUserRole(jwtPayload.role);
        this.validateUserSubscription(jwtPayload.subscription);

        return jwtPayload;
    }

    private validateUserRole(role: UserRole) {
        const validRoles: UserRole[] = ['CUSTOMER', 'EMPLOYEE', 'ADMIN', 'SUPER_ADMIN'];
        if (!validRoles.includes(role)) {
            throw new UnauthorizedException('Invalid user role');
        }
    }

    private validateUserSubscription(subscription: SubscriptionTier) {
        const validSubscriptions: SubscriptionTier[] = ['TRIAL', 'BEGINNER', 'PRO', 'ENTERPRISE'];
        if (!validSubscriptions.includes(subscription)) {
            throw new UnauthorizedException('Invalid subscription tier');
        }
    }

    private validatePayloadStructure(payload: any) {
        const requiredFields = ['sub', 'username', 'email', 'role', 'subscription'];
        for (const field of requiredFields) {
            if (!(field in payload)) {
                throw new UnauthorizedException(`Missing required field: ${field}`);
            }
        }
    }
}
