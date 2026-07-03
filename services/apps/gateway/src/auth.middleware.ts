import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.verify(token);
        
        // Inject headers for underlying services
        if (payload.sub) {
          req.headers['x-user-id'] = payload.sub;
        }
        if (payload.role) {
          req.headers['x-user-role'] = payload.role;
        }
      } catch (error) {
        // Token invalid or expired: do nothing, just let it pass without headers
        // The backend services will enforce authorization
      }
    }

    next();
  }
}
