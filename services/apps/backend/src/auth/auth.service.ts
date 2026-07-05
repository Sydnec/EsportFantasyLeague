import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5173/auth/callback',
    );
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email or Username already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash: hashedPassword,
      },
    });

    return this.generateTokens(user.id, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.role);
  }

  async refresh(authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const token = authHeader.substring(7);

    try {
      // 1. Verify signature
      const payload = this.jwtService.verify(token);

      // 2. Check if token exists in DB and is not revoked
      const savedToken = await this.prisma.userRefreshToken.findFirst({
        where: {
          token,
          userId: payload.sub,
        },
      });

      if (!savedToken || savedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) throw new UnauthorizedException('User not found');

      // 3. Revoke old token (delete it) and generate new ones (Refresh Token Rotation)
      await this.prisma.userRefreshToken.delete({
        where: { id: savedToken.id },
      });

      return this.generateTokens(user.id, user.role);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async googleAuth(code: string) {
    // Si on n'a pas les variables d'environnement, on utilise un mock pour le développement
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.warn('GOOGLE_CLIENT_ID is missing. Using MOCK for Google OAuth.');
      return this.mockGoogleAuth(code);
    }

    try {
      // 1. Echanger le code contre les tokens Google
      const { tokens } = await this.googleClient.getToken(code);
      this.googleClient.setCredentials(tokens);

      // 2. Obtenir les infos du profil
      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new BadRequestException('Google token invalid');
      }

      // 3. Chercher ou créer l'utilisateur
      let user = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: payload.email,
            username: payload.name || payload.email.split('@')[0],
            googleId: payload.sub,
          },
        });
      } else if (!user.googleId) {
        // Link account if email matches but googleId was empty
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: payload.sub },
        });
      }

      return this.generateTokens(user.id, user.role);
    } catch (e) {
      throw new BadRequestException('Google Auth failed');
    }
  }

  private async mockGoogleAuth(code: string) {
    // Mock user for local testing without proper Google setup
    const email = `mockuser_${code}@mock.com`;
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          username: `MockUser_${code}`,
          googleId: `mock_${code}`,
        },
      });
    }
    return this.generateTokens(user.id, user.role);
  }

  private async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Enregistrer le refresh token en DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.userRefreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      data: {
        accessToken,
        refreshToken,
      },
    };
  }
}
