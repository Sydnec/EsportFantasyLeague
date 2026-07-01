import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Role } from '@prisma/client';
import { JwtPayload } from '../common/decorators/current-user.decorator.js';
import { Response } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(user: JwtPayload & {
        refreshToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(user: JwtPayload & {
        refreshToken: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    exchangeCode(code: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    googleAuth(): Promise<void>;
    googleAuthCallback(req: {
        user: {
            id: string;
            email: string;
            role: Role;
        };
    }, res: Response): void;
}
