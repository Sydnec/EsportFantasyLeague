import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RABBITMQ_ROUTING_KEYS } from '@app/shared/rabbitmq/rabbitmq.constants';
import { EsportPlayerUpsertedDto } from '@app/shared/rabbitmq/dtos/esport.player.upserted.dto';
import { ScoringPointsCalculatedDto } from '@app/shared/rabbitmq/dtos/scoring.points.calculated.dto';
import { ConsumersService } from './consumers.service';

@Controller()
export class ConsumersController {
  constructor(private readonly consumersService: ConsumersService) {}

  @EventPattern(RABBITMQ_ROUTING_KEYS.ESPORT_PLAYER_UPSERTED)
  async handlePlayerUpserted(@Payload() data: EsportPlayerUpsertedDto) {
    await this.consumersService.handleEsportPlayerUpserted(data);
  }

  @EventPattern(RABBITMQ_ROUTING_KEYS.SCORING_POINTS_CALCULATED)
  async handleScoringCalculated(@Payload() data: ScoringPointsCalculatedDto) {
    await this.consumersService.handleScoringPointsCalculated(data);
  }
}
