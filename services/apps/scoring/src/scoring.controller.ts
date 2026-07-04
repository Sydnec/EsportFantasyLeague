import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RABBITMQ_ROUTING_KEYS } from '@app/shared/rabbitmq/rabbitmq.constants';
import { ScoringService } from './scoring.service';

@Controller()
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @EventPattern(RABBITMQ_ROUTING_KEYS.ESPORT_PERFORMANCE_INGESTED)
  async handlePerformanceIngested(@Payload() payload: any) {
    this.scoringService.calculatePointsAndPublish(payload);
  }
}
