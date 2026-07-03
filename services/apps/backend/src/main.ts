import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { BackendModule } from './backend.module';
import { RABBITMQ_QUEUES } from '@app/shared/rabbitmq/rabbitmq.constants';

async function bootstrap() {
  const app = await NestFactory.create(BackendModule);

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

  const rmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: RABBITMQ_QUEUES.BACKEND_SERVICE_ESPORT_QUEUE,
      queueOptions: { durable: true },
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: RABBITMQ_QUEUES.BACKEND_SERVICE_SCORING_QUEUE,
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.port ?? 3001);
}
bootstrap();
