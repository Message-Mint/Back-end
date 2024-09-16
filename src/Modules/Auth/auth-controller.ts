import { Body, Controller, Get, Post, Res, HttpStatus, UseGuards } from "@nestjs/common";
import { forgotPasswordDto, UserLoginDto, UserRegistrationDto } from "./Dto/Auth-Dto";
import { AuthService } from "./auth-service";
import { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from "./jwt-auth-guard";

@Controller('user')
export class AuthController {
    constructor(
        private readonly auth: AuthService
    ) { }

    @Get('check')
    async helloWorld() {
        return { status: HttpStatus.OK, message: "Hey! It's me 👋 MessageMint 💌" };
    }

    @Post('signup')
    async signup(@Res() res: ExpressResponse, @Body() signUpData: UserRegistrationDto) {
        try {
            const result = await this.auth.registerNewUser(signUpData, res);
            return res.status(HttpStatus.CREATED).json(result);
        } catch (error) {
            if (error.response) {
                return res.status(error.status).json(error.response);
            }
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }

    @Post('signin')
    async signin(@Res() res: ExpressResponse, @Body() signInData: UserLoginDto) {
        try {
            const result = await this.auth.loginUser(signInData, res); // Assuming login method exists in AuthService
            return res.status(HttpStatus.OK).json(result);
        } catch (error) {
            if (error.response) {
                return res.status(error.status).json(error.response);
            }
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }
    }

    @Post('forgot-password')
    @UseGuards(JwtAuthGuard)
    async forgotPassword(@Res() res: ExpressResponse, @Body() forgotPasswordData: forgotPasswordDto) {
        try {
            const result = await this.auth.chnageUserPassword(forgotPasswordData, res); // Assuming login method exists in AuthService
            return res.status(HttpStatus.OK).json(result);
        } catch (error) {
            if (error.response) {
                return res.status(error.status).json(error.response);
            }
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }
    }
}
