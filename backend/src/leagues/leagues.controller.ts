import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { LeaguesService } from './leagues.service.js';
import { CreateLeagueDto } from './dto/create-league.dto.js';
import { JoinLeagueDto } from './dto/join-league.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator.js';

@Controller('leagues')
@UseGuards(JwtAuthGuard)
export class LeaguesController {
  constructor(private leaguesService: LeaguesService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLeagueDto) {
    return this.leaguesService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.leaguesService.findUserLeagues(user.userId);
  }

  @Get('upcoming-tournaments')
  getUpcomingTournaments() {
    return this.leaguesService.getUpcomingTournaments();
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.leaguesService.findById(id, user.userId);
  }

  @Post(':id/join')
  join(@CurrentUser() user: JwtPayload, @Body() dto: JoinLeagueDto) {
    return this.leaguesService.join(user.userId, dto.inviteCode);
  }

  @Get(':id/leaderboard')
  leaderboard(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.leaguesService.getLeaderboard(id, user.userId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.leaguesService.remove(user.userId, id);
  }
}
