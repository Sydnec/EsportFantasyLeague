import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { EsportAdapterModule } from './esport-adapter.module';

async function bootstrap() {
  const app = await NestFactory.create(EsportAdapterModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Remarque : Le module RabbitMQ est initialisé dans EsportModule via ClientProxy.
  // Esport Adapter ne consomme pas d'événements pour le moment, il n'a donc pas besoin de connectMicroservice()

  await app.listen(process.env.port ?? 3002);
}
bootstrap();
