import { Module } from "@nestjs/common";
import { AuthController } from "./auth-controller";
import { AuthService } from "./auth-service";
import { UserRepository } from "../../Common/Repositorys/user-repository";
import { PrismaService } from "../../Common/Database-Management/Prisma/prisma-service";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./jwt-strategy";
import { LoggerService } from "../../Helpers/Logger/logger-service";
import { JwtModule } from "@nestjs/jwt";
import { LocalStrategy } from "./local.strategy";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '7d' },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, UserRepository, PrismaService, JwtStrategy, LoggerService, LocalStrategy]
})
export class AuthModule { }
