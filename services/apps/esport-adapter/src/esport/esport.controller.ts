import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Game } from '@prisma/client-esport';
import { EsportService } from './esport.service';

@Controller('esport')
export class EsportController {
  constructor(private readonly esportService: EsportService) {}

  // ── Manual sync triggers (same code path as the cron jobs — useful for testing) ──

  @Post('sync/players/:game')
  syncPlayers(@Param('game') game: Game) {
    return this.esportService.syncPlayers(game);
  }

  @Post('sync/matches/:game')
  syncMatches(@Param('game') game: Game) {
    return this.esportService.syncMatches(game);
  }

  @Post('sync/stats/:game')
  syncStats(@Param('game') game: Game) {
    return this.esportService.syncStats(game);
  }

  @Post('sync/live/:game')
  syncLiveGames(@Param('game') game: Game) {
    return this.esportService.syncLiveGames(game);
  }

  // ── Pro players ──

  @Get('pro-players')
  getProPlayers(@Query('game') game?: Game, @Query('team') team?: string, @Query('role') role?: string) {
    return this.esportService.getProPlayers({ game, team, role });
  }

  // The frontend may pass `?leagueId=` for draft context, but that data lives
  // in the Backend Service's own FantasyRoster tables — not accessible here —
  // so it's silently ignored for now rather than declared as an unused param.
  @Get('pro-players/match-day/:matchDayId')
  getProPlayersByMatchDay(@Param('matchDayId') matchDayId: string) {
    return this.esportService.getProPlayersByMatchDay(matchDayId);
  }

  @Get('pro-players/:id')
  getProPlayerById(@Param('id') id: string) {
    return this.esportService.getProPlayerById(id);
  }

  // ── Match days & matches ──

  @Get('match-days')
  getMatchDays(@Query('game') game?: Game, @Query('status') status?: string, @Query('date') date?: string) {
    return this.esportService.getUpcomingMatchDays({ game, status, date });
  }

  @Get('match-days/:id')
  getMatchDayById(@Param('id') id: string) {
    return this.esportService.getMatchDayById(id);
  }

  @Get('matches/:id')
  getMatchById(@Param('id') id: string) {
    return this.esportService.getMatchById(id);
  }
}
