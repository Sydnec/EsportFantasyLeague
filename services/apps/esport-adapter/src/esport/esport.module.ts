import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@app/shared/rabbitmq/rabbitmq.module';
import { RABBITMQ_QUEUES } from '@app/shared/rabbitmq/rabbitmq.constants';
import { PandascoreModule } from '../pandascore/pandascore.module';
import { AdaptersModule } from '../adapters/adapters.module';
import { EsportController } from './esport.controller';
import { EsportService } from './esport.service';
import { BACKEND_ESPORT_RMQ_CLIENT, SCORING_RMQ_CLIENT } from './esport.constants';

@Module({
  imports: [
    PandascoreModule,
    AdaptersModule,
    // Publishes esport.player/team/matchday.upserted — must target the queue
    // the Backend Service actually consumes (see esport.constants.ts).
    RabbitMQModule.register({
      name: BACKEND_ESPORT_RMQ_CLIENT,
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: RABBITMQ_QUEUES.BACKEND_SERVICE_ESPORT_QUEUE,
    }),
    // Publishes esport.performance.ingested — must target the Scoring Service's queue.
    RabbitMQModule.register({
      name: SCORING_RMQ_CLIENT,
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: RABBITMQ_QUEUES.SCORING_SERVICE_QUEUE,
    }),
  ],
  controllers: [EsportController],
  providers: [EsportService],
})
export class EsportModule {}
