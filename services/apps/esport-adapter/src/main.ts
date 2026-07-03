import { NestFactory } from '@nestjs/core';
import { EsportAdapterModule } from './esport-adapter.module';

async function bootstrap() {
  const app = await NestFactory.create(EsportAdapterModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
