import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  // The gateway only proxies requests — it never reads req.body itself. Nest's
  // default global body-parser would otherwise consume the incoming stream
  // before http-proxy-middleware can pipe it to the target, hanging every
  // proxied POST/PATCH/PUT request.
  const app = await NestFactory.create(GatewayModule, { bodyParser: false });

  // The frontend (Vite dev server) runs on a different origin than the gateway,
  // so the browser needs an explicit CORS allow before it'll let requests through.
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  await app.listen(process.env.port ?? 3000);
}
bootstrap();
