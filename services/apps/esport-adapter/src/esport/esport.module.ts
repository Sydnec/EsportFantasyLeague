import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@app/shared/rabbitmq/rabbitmq.module';
import { PandascoreModule } from '../pandascore/pandascore.module';
import { EsportController } from './esport.controller';
import { EsportService } from './esport.service';

@Module({
  imports: [
    PandascoreModule,
    RabbitMQModule.register({
      name: 'RABBITMQ_CLIENT',
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'esport-adapter-queue', // Adapter doesn't necessarily need a durable listening queue in Phase 1, but register requires it. Let's use a dummy or shared exchange.
    }),
  ],
  controllers: [EsportController],
  providers: [EsportService],
})
export class EsportModule {}
