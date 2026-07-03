import { Controller, Get, Param, Post } from '@nestjs/common';
import { EsportService } from './esport.service';

@Controller('esport')
export class EsportController {
  constructor(private readonly esportService: EsportService) {}

  @Post('sync/players/:game')
  syncPlayers(@Param('game') game: string) {
    return this.esportService.syncPlayers(game);
  }

  @Post('simulate/match-day/:id')
  simulateIngestion(@Param('id') id: string) {
    return this.esportService.simulateMatchIngestion(id);
  }

  @Get('pro-players')
  getProPlayers() {
    return this.esportService.getProPlayers();
  }

  @Get('match-days')
  getMatchDays() {
    return this.esportService.getUpcomingMatchDays();
  }
}
