import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProPlayersService } from './pro-players.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Game } from '@prisma/client';

@Controller('pro-players')
@UseGuards(JwtAuthGuard)
export class ProPlayersController {
  constructor(private proPlayersService: ProPlayersService) {}

  @Get()
  findAll(
    @Query('game') game?: Game,
    @Query('team') team?: string,
    @Query('role') role?: string,
  ) {
    return this.proPlayersService.findAll({ game, team, role });
  }

  @Get('match-day/:matchDayId')
  findByMatchDay(@Param('matchDayId') matchDayId: string) {
    return this.proPlayersService.findByMatchDay(matchDayId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proPlayersService.findById(id);
  }
}
