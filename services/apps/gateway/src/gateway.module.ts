import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request } from 'express';
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
    // 1. Appliquer le middleware d'authentification sur toutes les routes /api/v1/*path
    consumer.apply(AuthMiddleware).forRoutes('/api/v1/*path');

    // 2. Configurer les proxies pour le Backend Service (port 3001)
    //
    // Nest mounts path-scoped middleware the way Express does for `app.use(mountPath, ...)`:
    // it strips the matched prefix from `req.url` before the middleware runs (e.g.
    // `/api/v1/leagues/upcoming-tournaments` arrives here as `/upcoming-tournaments`).
    // http-proxy-middleware forwards `req.url` as-is, so without `pathRewrite` every
    // proxied request loses its prefix downstream and 404s. `req.originalUrl` still
    // holds the untouched, full inbound path, so use that as the forwarded path.
    const backendProxy = createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: (_path, req: Request) => req.originalUrl,
    });

    consumer
      .apply(backendProxy)
      .forRoutes(
        '/api/v1/auth', '/api/v1/auth/*path',
        '/api/v1/leagues', '/api/v1/leagues/*path',
        '/api/v1/rosters', '/api/v1/rosters/*path',
        '/api/v1/users', '/api/v1/users/*path',
      );

    // 3. Configurer le proxy pour l'Esport Adapter Service (port 3002)
    const esportProxy = createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
      pathRewrite: (_path, req: Request) => req.originalUrl,
    });

    // Substituted '/api/v1/esport/*' with '/api/v1/esport/*path'
    consumer.apply(esportProxy).forRoutes('/api/v1/esport', '/api/v1/esport/*path');
  }
}