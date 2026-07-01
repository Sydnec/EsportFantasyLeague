import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Profile } from 'passport-google-oauth20';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    private oauthCodes;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refreshToken(userId: string, token: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    validateOAuthUser(profile: Profile): Promise<{
        email: string;
        username: string;
        id: string;
        passwordHash: string | null;
        googleId: string | null;
        avatarUrl: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateTokens(userId: string, email: string, role: string): {
        accessToken: string;
        refreshToken: string;
    };
    saveRefreshToken(userId: string, token: string): Promise<void>;
    logout(userId: string, token: string): Promise<void>;
    generateOAuthCode(userId: string, email: string, role: string): string;
    exchangeOAuthCode(code: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
