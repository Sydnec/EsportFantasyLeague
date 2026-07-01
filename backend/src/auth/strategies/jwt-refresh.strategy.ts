import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JwtPayload } from '../../common/decorators/current-user.decorator.js';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET as string,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<JwtPayload & { refreshToken: string }> {
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
}
