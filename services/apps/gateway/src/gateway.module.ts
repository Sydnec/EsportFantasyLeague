import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AuthMiddleware } from './auth.middleware';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'esfl-super-secret',
    }),
  ],
})
export class GatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 1. Appliquer le middleware d'authentification sur toutes les routes /api/v1/*
    consumer.apply(AuthMiddleware).forRoutes('/api/v1/*');

    // 2. Configurer les proxies pour le Backend Service (port 3001)
    const backendProxy = createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    });

    consumer
      .apply(backendProxy)
      .forRoutes(
        '/api/v1/auth', '/api/v1/auth/*',
        '/api/v1/leagues', '/api/v1/leagues/*',
        '/api/v1/rosters', '/api/v1/rosters/*',
        '/api/v1/users', '/api/v1/users/*',
      );

    // 3. Configurer le proxy pour l'Esport Adapter Service (port 3002)
    const esportProxy = createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
    });

    consumer.apply(esportProxy).forRoutes('/api/v1/esport', '/api/v1/esport/*');
  }
}
