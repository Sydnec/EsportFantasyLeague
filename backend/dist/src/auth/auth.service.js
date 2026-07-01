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
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
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
        return this.generateTokens(user.id, user.email);
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
        return this.generateTokens(user.id, user.email);
    }
    async refreshToken(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return this.generateTokens(user.id, user.email);
    }
    async validateOAuthUser(profile) {
        const { id: googleId, emails, displayName, photos } = profile;
        const email = emails[0].value;
        const avatarUrl = photos?.[0]?.value || null;
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
            const username = displayName.replace(/\s+/g, '').toLowerCase();
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
    generateTokens(userId, email) {
        const payload = { userId, email };
        return {
            accessToken: this.jwtService.sign(payload, { expiresIn: '2h' }),
            refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
        };
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        JwtService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map