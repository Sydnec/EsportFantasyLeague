import { Controller, Get, Param, Query } from '@nestjs/common';
import { MatchDaysService } from './match-days.service.js';
import { Game, MatchDayStatus } from '@prisma/client';

@Controller('match-days')
export class MatchDaysController {
  constructor(private matchDaysService: MatchDaysService) {}

  @Get()
  findAll(
    @Query('game') game?: Game,
    @Query('status') status?: MatchDayStatus,
    @Query('date') date?: string,
  ) {
    return this.matchDaysService.findAll({ game, status, date });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchDaysService.findById(id);
  }
}
