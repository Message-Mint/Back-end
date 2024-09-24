import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from './Dto/Auth-Dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
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

    async validate(payload: any): Promise<JwtPayload | string> {
        if (!payload) {
            throw new UnauthorizedException('Invalid token');
        }

        const user = {
            userId: payload.sub,
            username: payload.username,
            email: payload.email,
            plan: payload.plan,
            userType: payload.userType
        };

        if (!user.userId || !user.username || !user.email || !user.plan || !user.userType) {
            throw new UnauthorizedException('Token payload does not contain required fields');
        }

        // Additional checks can be added here if needed
        if (user.plan === 'EXPIRED') {
            throw new UnauthorizedException('User subscription has expired');
        }

        return user;
    }
}
