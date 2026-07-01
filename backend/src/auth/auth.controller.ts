import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { GoogleOauthGuard } from './guards/google-oauth.guard.js';
import { Role } from '@prisma/client';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator.js';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  refresh(@CurrentUser() user: JwtPayload & { refreshToken: string }) {
    return this.authService.refreshToken(user.userId, user.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  async logout(@CurrentUser() user: JwtPayload & { refreshToken: string }) {
    await this.authService.logout(user.userId, user.refreshToken);
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('google/token')
  async exchangeCode(@Body('code') code: string) {
    return this.authService.exchangeOAuthCode(code);
  }

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {
    // Passport will handle the redirect
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  googleAuthCallback(
    @Req() req: { user: { id: string; email: string; role: Role } },
    @Res() res: Response,
  ) {
    const user = req.user;
    const code = this.authService.generateOAuthCode(
      user.id,
      user.email,
      user.role,
    );
    const frontendUrl = (
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ).replace(/\/$/, '');
    return res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
  }
}
