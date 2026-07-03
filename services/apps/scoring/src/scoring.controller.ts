import { Controller, Get } from '@nestjs/common';
import { ScoringService } from './scoring.service';

@Controller()
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Get()
  getHello(): string {
    return this.scoringService.getHello();
  }
}
