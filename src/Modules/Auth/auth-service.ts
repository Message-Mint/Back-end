import { Injectable, BadRequestException, ConflictException, InternalServerErrorException } from "@nestjs/common";
import { UserLoginDto, UserRegistrationDto } from "./Dto/Auth-Dto";
import { validateRegistrationData } from "src/Utils/validateRegistrationData";
import { UserRepository } from "../Common/Repositorys/user-repository";
import * as bcrypt from 'bcrypt';
import { determineSaltRounds } from "src/Utils/determineSaltRounds";
import { Prisma, User } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Response as ExpressResponse } from 'express';
import { UserEntity } from "../Common/Entities/user-entities";
import { LoggerService } from "../Helpers/Logger/logger-service";

@Injectable()
export class AuthService {
    constructor(
        private readonly userDBRepo: UserRepository,
        private jwt: JwtService,
        private readonly env: ConfigService,
        private readonly logger: LoggerService
    ) { }

    async registerNewUser(registrationData: UserRegistrationDto, res: ExpressResponse) {
        try {
            this.logger.log('Attempting to register new user', 'AuthService');

            if (!registrationData || Object.keys(registrationData).length === 0) {
                throw new BadRequestException("Invalid registration data");
            }

            await validateRegistrationData(registrationData);

            await this.checkExistingUser(registrationData);

            const hashedPassword = await this.hashPassword(registrationData.password);
            const nickName = registrationData.nickName || `${registrationData.firstName} ${registrationData.lastName}`;

            const userDataWithHashedPassword: Prisma.UserCreateInput = {
                userName: registrationData.userName.trim(),
                emailAddress: registrationData.emailAddress.toLowerCase().trim(),
                phoneNumber: registrationData.phoneNumber.trim(),
                password: hashedPassword,
                firstName: registrationData.firstName.trim(),
                lastName: registrationData.lastName.trim(),
                nickName: nickName.trim(),
                subscriptionActiveAt: new Date(),
            };

            const newUser = await this.userDBRepo.createUser(userDataWithHashedPassword);
            this.logger.log(`User registered successfully: ${newUser.userName}`, 'AuthService');

            return await this.setJwtTokentoBrowser(newUser, "signup", res);
        } catch (error) {
            this.logger.error(`Registration failed: ${error.message}`, error.stack, 'AuthService');
            this.handleAuthError(error);
        }
    }

    async loginUser(loginData: UserLoginDto, res: ExpressResponse) {
        try {
            this.logger.log('Attempting user login', 'AuthService');

            if (!loginData || Object.keys(loginData).length === 0) {
                throw new BadRequestException("Invalid login data");
            }

            const { emailAddress, userName, password } = loginData;
            const isEmail = !!emailAddress;
            const userUniqueData = isEmail ? emailAddress?.toLowerCase().trim() : userName?.trim();

            if (!userUniqueData) {
                throw new BadRequestException("Either email or username must be provided");
            }

            const user = await this.findUserByEmailOrUsername(isEmail, userUniqueData);
            await this.validateUserLogin(user, password);

            await this.userDBRepo.updateUserById(user.id, { lastLogin: new Date() });
            this.logger.log(`User logged in successfully: ${user.userName}`, 'AuthService');

            return this.setJwtTokentoBrowser(user, "signin", res);
        } catch (error) {
            this.logger.error(`Login failed: ${error.message}`, error.stack, 'AuthService');
            this.handleAuthError(error);
        }
    }

    private async checkExistingUser(registrationData: UserRegistrationDto) {
        const isEmailExist = await this.userDBRepo.findUserByEmail(registrationData.emailAddress.toLowerCase().trim());
        if (isEmailExist) {
            throw new ConflictException("Email already exists");
        }

        const isUserNameExist = await this.userDBRepo.findUserByUserName(registrationData.userName.trim());
        if (isUserNameExist) {
            throw new ConflictException("Username already exists");
        }

        const isPhoneNumberExist = await this.userDBRepo.findUserByPhoneNumber(registrationData.phoneNumber.trim());
        if (isPhoneNumberExist) {
            throw new ConflictException("Phone number already exists");
        }
    }

    private async hashPassword(password: string): Promise<string> {
        const saltRounds = determineSaltRounds(password);
        return bcrypt.hash(password, saltRounds);
    }

    private async findUserByEmailOrUsername(isEmail: boolean, userUniqueData: string): Promise<UserEntity> {
        const user = isEmail
            ? await this.userDBRepo.findUserByEmail(userUniqueData)
            : await this.userDBRepo.findUserByUserName(userUniqueData);

        if (!user) {
            throw new BadRequestException(`${isEmail ? 'Email' : 'Username'} not found`);
        }

        return user;
    }

    private async validateUserLogin(user: UserEntity, password: string) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException("Invalid password");
        }

        if (!user.isActive) {
            throw new BadRequestException("Account is not active. Please contact support.");
        }
    }

    private async setJwtTokentoBrowser(userData: UserEntity, type: "signin" | "signup", res: ExpressResponse) {
        try {
            const payload = {
                sub: userData.id,
                username: userData.userName,
                nickName: userData.nickName,
                email: userData.emailAddress,
                plan: userData.currentSubscription,
                userType: userData.userType,
            };

            const accessToken = this.jwt.sign(payload, {
                expiresIn: '7d',
            });

            res.cookie('jwt', accessToken, {
                httpOnly: true,
                secure: this.env.get<string>("NODE_ENV") === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            return {
                message: `User ${type} successful`,
                statusCode: 200,
                user: {
                    id: userData.id,
                    username: userData.userName,
                    email: userData.emailAddress,
                    nickName: userData.nickName,
                    plan: userData.currentSubscription,
                    userType: userData.userType,
                    lastLogin: new Date()
                }
            };
        } catch (error) {
            this.logger.error(`Failed to set JWT token: ${error.message}`, error.stack, 'AuthService');
            throw new InternalServerErrorException("Authentication failed");
        }
    }

    private handleAuthError(error: any) {
        if (error instanceof BadRequestException || error instanceof ConflictException) {
            throw error;
        }
        throw new InternalServerErrorException("Authentication failed");
    }
}
