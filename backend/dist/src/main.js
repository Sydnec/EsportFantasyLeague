import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
async function bootstrap() {
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
        throw new Error('FATAL: JWT_ACCESS_SECRET or JWT_REFRESH_SECRET environment variable is missing.');
    }
    const app = await NestFactory.create(AppModule);
    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    const allowedOrigins = new Set([
        'http://localhost:5173',
        'http://localhost:3001',
        'http://localhost:4174',
    ]);
    const frontendUrl = process.env.FRONTEND_URL?.trim().replace(/\/$/, '');
    if (frontendUrl) {
        allowedOrigins.add(frontendUrl);
    }
    const corsOrigin = (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        const normalizedOrigin = origin.replace(/\/$/, '');
        callback(null, allowedOrigins.has(normalizedOrigin));
    };
    app.enableCors({
        origin: corsOrigin,
        credentials: true,
    });
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await app.listen(port);
    console.log(`🚀 Fantasy League API running on port ${port}`);
}
bootstrap().catch(console.error);
//# sourceMappingURL=main.js.map