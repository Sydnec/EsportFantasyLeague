var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, ConflictException, UnauthorizedException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { nanoid } from 'nanoid';
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    oauthCodes = new Map();
    async register(dto) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, { username: dto.username }],
            },
        });
        if (existingUser) {
            throw new ConflictException('Email or username already exists');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                username: dto.username,
                passwordHash,
            },
        });
        const tokens = this.generateTokens(user.id, user.email, user.role);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const tokens = this.generateTokens(user.id, user.email, user.role);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async refreshToken(userId, token) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const dbToken = await this.prisma.refreshToken.findUnique({
            where: { token },
        });
        if (!dbToken || dbToken.expiresAt < new Date()) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
        const tokens = this.generateTokens(user.id, user.email, user.role);
        await this.prisma.$transaction([
            this.prisma.refreshToken.delete({ where: { token } }),
            this.prisma.refreshToken.create({
                data: {
                    token: tokens.refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            }),
        ]);
        return tokens;
    }
    async validateOAuthUser(profile) {
        const rawProfile = profile;
        const { id: googleId, emails, displayName, photos } = rawProfile;
        const email = emails?.[0]?.value || rawProfile._json?.email?.trim() || undefined;
        if (!email) {
            throw new UnauthorizedException('No email provided by Google OAuth');
        }
        const avatarUrl = photos?.[0]?.value || rawProfile._json?.picture || null;
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [{ googleId }, { email }],
            },
        });
        if (user) {
            if (!user.googleId) {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: { googleId, avatarUrl: user.avatarUrl || avatarUrl },
                });
            }
        }
        else {
            const baseUsername = displayName?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ||
                rawProfile._json?.name?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ||
                [rawProfile._json?.given_name, rawProfile._json?.family_name]
                    .filter(Boolean)
                    .join('')
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .toLowerCase() ||
                email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ||
                `user${googleId.slice(0, 8)}`;
            const username = baseUsername || `user${googleId.slice(0, 8)}`;
            let uniqueUsername = username;
            let counter = 1;
            while (await this.prisma.user.findUnique({
                where: { username: uniqueUsername },
            })) {
                uniqueUsername = `${username}${counter}`;
                counter++;
            }
            user = await this.prisma.user.create({
                data: {
                    email,
                    username: uniqueUsername,
                    googleId,
                    avatarUrl,
                },
            });
        }
        return user;
    }
    generateTokens(userId, email, role) {
        const payload = { userId, email, role };
        return {
            accessToken: this.jwtService.sign(payload, {
                secret: process.env.JWT_ACCESS_SECRET ||
                    'super-secret-access-key-change-in-production',
                expiresIn: '2h',
            }),
            refreshToken: this.jwtService.sign(payload, {
                secret: process.env.JWT_REFRESH_SECRET ||
                    'super-secret-refresh-key-change-in-production',
                expiresIn: '7d',
            }),
        };
    }
    async saveRefreshToken(userId, token) {
        await this.prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
    }
    async logout(userId, token) {
        await this.prisma.refreshToken.deleteMany({
            where: {
                userId,
                token,
            },
        });
    }
    generateOAuthCode(userId, email, role) {
        const code = nanoid(20);
        this.oauthCodes.set(code, {
            userId,
            email,
            role,
            expiresAt: Date.now() + 30000,
        });
        return code;
    }
    async exchangeOAuthCode(code) {
        const data = this.oauthCodes.get(code);
        if (!data || data.expiresAt < Date.now()) {
            this.oauthCodes.delete(code);
            throw new UnauthorizedException('Invalid or expired oauth code');
        }
        this.oauthCodes.delete(code);
        const tokens = this.generateTokens(data.userId, data.email, data.role);
        await this.saveRefreshToken(data.userId, tokens.refreshToken);
        return tokens;
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        JwtService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map