import { NestFactory } from '@nestjs/core';
import { ScoringModule } from './scoring.module';

async function bootstrap() {
  const app = await NestFactory.create(ScoringModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
