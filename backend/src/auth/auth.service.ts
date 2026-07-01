import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { nanoid } from 'nanoid';
import { Profile } from 'passport-google-oauth20';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private oauthCodes = new Map<
    string,
    { userId: string; email: string; role: string; expiresAt: number }
  >();

  async register(dto: RegisterDto) {
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

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async refreshToken(userId: string, token: string) {
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

  async validateOAuthUser(profile: Profile) {
    const rawProfile = profile as Profile & {
      _json?: {
        email?: string;
        name?: string;
        given_name?: string;
        family_name?: string;
        picture?: string;
      };
    };

    const { id: googleId, emails, displayName, photos } = rawProfile;
    const email =
      emails?.[0]?.value || rawProfile._json?.email?.trim() || undefined;
    if (!email) {
      throw new UnauthorizedException('No email provided by Google OAuth');
    }
    const avatarUrl =
      photos?.[0]?.value || rawProfile._json?.picture || null;

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
    } else {
      const baseUsername =
        displayName?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ||
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
      while (
        await this.prisma.user.findUnique({
          where: { username: uniqueUsername },
        })
      ) {
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

  generateTokens(userId: string, email: string, role: string) {
    const payload = { userId, email, role };

    return {
      accessToken: this.jwtService.sign(payload, {
        secret:
          process.env.JWT_ACCESS_SECRET ||
          'super-secret-access-key-change-in-production',
        expiresIn: '2h',
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          'super-secret-refresh-key-change-in-production',
        expiresIn: '7d',
      }),
    };
  }

  async saveRefreshToken(userId: string, token: string) {
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async logout(userId: string, token: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token,
      },
    });
  }

  generateOAuthCode(userId: string, email: string, role: string): string {
    const code = nanoid(20);
    this.oauthCodes.set(code, {
      userId,
      email,
      role,
      expiresAt: Date.now() + 30000, // 30 seconds
    });
    return code;
  }

  async exchangeOAuthCode(code: string) {
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
}
