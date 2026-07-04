import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@app/shared/rabbitmq/rabbitmq.module';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';

@Module({
  imports: [
    RabbitMQModule.register({
      name: 'RABBITMQ_CLIENT',
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'scoring-service-queue',
    }),
  ],
  controllers: [ScoringController],
  providers: [ScoringService],
})
export class ScoringModule {}
