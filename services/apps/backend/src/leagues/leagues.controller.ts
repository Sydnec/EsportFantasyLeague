import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { HeaderAuthGuard } from '../common/guards/header-auth.guard';
import { CreateLeagueDto, JoinLeagueDto } from './dto/leagues.dto';
import { LeaguesService } from './leagues.service';

@Controller('leagues')
@UseGuards(HeaderAuthGuard)
export class LeaguesController {
  constructor(private readonly leaguesService: LeaguesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.leaguesService.findAllForUser(req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateLeagueDto) {
    return this.leaguesService.create(req.user.id, dto);
  }

  @Get('upcoming-tournaments')
  getUpcomingTournaments() {
    return this.leaguesService.getUpcomingTournamentsMock();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaguesService.findOne(id);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.leaguesService.remove(req.user.id, id);
  }

  @Post(':id/join')
  join(@Req() req: any, @Param('id') id: string, @Body() dto: JoinLeagueDto) {
    return this.leaguesService.join(req.user.id, id, dto);
  }

  @Get(':leagueId/leaderboard')
  getLeaderboard(@Param('leagueId') leagueId: string) {
    return this.leaguesService.getLeaderboard(leagueId);
  }
}
