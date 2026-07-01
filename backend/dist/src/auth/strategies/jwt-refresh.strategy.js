var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
let JwtRefreshStrategy = class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    prisma;
    constructor(prisma) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_REFRESH_SECRET,
            passReqToCallback: true,
        });
        this.prisma = prisma;
    }
    async validate(req, payload) {
        const refreshToken = req
            .get('Authorization')
            ?.replace('Bearer ', '')
            .trim();
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token missing');
        }
        const dbToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (!dbToken || dbToken.expiresAt < new Date()) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
        return {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            refreshToken,
        };
    }
};
JwtRefreshStrategy = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], JwtRefreshStrategy);
export { JwtRefreshStrategy };
//# sourceMappingURL=jwt-refresh.strategy.js.map