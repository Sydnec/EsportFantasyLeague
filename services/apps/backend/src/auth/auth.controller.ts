import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthDto, LoginDto, RegisterDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Req() req: any) {
    const authHeader = req.headers.authorization as string;
    return this.authService.refresh(authHeader);
  }

  @Post('google/token')
  googleToken(@Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(dto.code);
  }
}
