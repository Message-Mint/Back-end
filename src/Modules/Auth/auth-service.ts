import { Injectable, BadRequestException, ConflictException, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { forgotPasswordDto, JwtPayload, UserLoginDto, UserRegistrationDto } from "./Dto/Auth-Dto";
import { validateRegistrationData } from "src/Utils/validateRegistrationData";
import { UserRepository } from "../../Common/Repositorys/user-repository";
import * as bcrypt from 'bcrypt';
import { determineSaltRounds } from "src/Utils/determineSaltRounds";
import { Prisma, User } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Response as ExpressResponse } from 'express';
import { UserEntity } from "../../Common/Entities/user-entities";
import { LoggerService } from "../../Helpers/Logger/logger-service";

@Injectable()
export class AuthService {
    constructor(
        private readonly userDBRepo: UserRepository,
        private jwt: JwtService,
        private readonly env: ConfigService,
        private readonly logger: LoggerService
    ) { }

    async validateUser(username: string, password: string): Promise<any> {
        const user = await this.userDBRepo.findUserByUserName(username);
        if (user && user.password === password) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

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
                username: registrationData.userName.trim(),
                email: registrationData.emailAddress.toLowerCase().trim(),
                phone: registrationData.phoneNumber.trim(),
                password: hashedPassword,
                firstName: registrationData.firstName.trim(),
                lastName: registrationData.lastName.trim(),
                nickname: nickName.trim(),
                subscriptionStartDate: new Date(),
            };

            const newUser = await this.userDBRepo.createUser(userDataWithHashedPassword);
            this.logger.log(`User registered successfully: ${newUser.username}`, 'AuthService');

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
            this.logger.log(`User logged in successfully: ${user.username}`, 'AuthService');

            return await this.setJwtTokentoBrowser(user, "signin", res);
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

    private async setJwtTokentoBrowser(
        userData: UserEntity,
        type: "signin" | "signup",
        res: ExpressResponse
    ) {
        try {
            // Create JWT payload
            const payload = {
                sub: userData.id,
                username: userData.username,
                nickName: userData.nickname,
                email: userData.email,
                plan: userData.currentSubscription,
                userType: userData.role,
            };

            // Generate JWT with a 7-day expiration
            const accessToken = this.jwt.sign(payload, {
                expiresIn: '7d',
            });

            res.setHeader('Set-Cookie', `authToken=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict`);
            // Set JWT as HttpOnly, Secure, and SameSite cookie in the response
            res.cookie('authToken', accessToken, {
                httpOnly: true,
                secure: this.env.get<string>("NODE_ENV") === 'production' ? true : false,
                sameSite: this.env.get<string>("NODE_ENV") === 'production' ? "strict" : "none", // Or 'Strict' or 'None' depending on your needs
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            });

            // Return success message and user info
            return {
                message: `User ${type} successful`,
                statusCode: 200,
                token: accessToken,
                user: {
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    nickName: userData.nickname,
                    plan: userData.currentSubscription,
                    userType: userData.role,
                    lastLogin: new Date(),
                },
            };
        } catch (error) {
            // Log the error and throw an internal server error exception
            this.logger.error(`Failed to set JWT token: ${error.message}`, error.stack, 'AuthService');
            throw new InternalServerErrorException('Authentication failed. Please try again later.');
        }
    }


    private handleAuthError(error: any) {
        if (error instanceof BadRequestException || error instanceof ConflictException) {
            throw error;
        }
        throw new InternalServerErrorException("Authentication failed");
    }


    async chnageUserPassword(newPassData: forgotPasswordDto, res: ExpressResponse) {
        if (!newPassData || Object.keys(newPassData).length === 0) {
            throw new BadRequestException("Invalid Forgot Password data");
        }

        const isUserValid = await this.userDBRepo.findUserByUserName(newPassData.username);

        if (!isUserValid) {
            throw new UnauthorizedException("User doesn't Exist on Database")
        }

        await this.validateUserLogin(isUserValid, newPassData.newPassword);

        return await this.userDBRepo.updateUserById(isUserValid.id, { password: await this.hashPassword(newPassData.newPassword) })
    }

    async verifyTokenData(tokenPayload: JwtPayload) {
        try {
            this.logger.log('Verifying token data', 'AuthService');

            // Fetch the user from the database
            const user = await this.userDBRepo.findUserById(tokenPayload.userId);

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            // Check if the email in the token matches the user's email
            if (user.email !== tokenPayload.email) {
                throw new UnauthorizedException('Email mismatch');
            }

            // Check if the username in the token matches the user's username
            if (user.username !== tokenPayload.username) {
                throw new UnauthorizedException('Username mismatch');
            }

            // Check if the plan in the token matches the user's current subscription
            if (user.currentSubscription !== tokenPayload.subscription) {
                throw new UnauthorizedException('Subscription plan mismatch');
            }

            // Check if the userType in the token matches the user's userType
            if (user.role !== tokenPayload.role) {
                throw new UnauthorizedException('User type mismatch');
            }

            // Check if the user's account is active
            if (!user.isActive) {
                throw new UnauthorizedException('Account is not active');
            }

            // If all checks pass, return the validated user data
            return {
                message: 'Token is valid',
                statusCode: 200,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    nickName: user.nickname,
                    plan: user.currentSubscription,
                    userType: user.role,
                    lastLogin: user.lastLogin,
                    isEmailVerified: user?.emailVerification?.isEmailVerified,
                    isActive: user.isActive
                }
            };
        } catch (error) {
            this.logger.error(`Token verification failed: ${error.message}`, error.stack, 'AuthService');
            throw error; // Re-throw the error to be handled by the calling method
        }
    }
}
