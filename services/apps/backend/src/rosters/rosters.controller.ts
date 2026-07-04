import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { HeaderAuthGuard } from '../common/guards/header-auth.guard';
import { CreateRosterDto, UpdateRosterPicksDto } from './dto/rosters.dto';
import { RostersService } from './rosters.service';

@Controller('rosters')
@UseGuards(HeaderAuthGuard)
export class RostersController {
  constructor(private readonly rostersService: RostersService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateRosterDto) {
    return this.rostersService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.rostersService.findAllForUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rostersService.findOne(id);
  }

  @Patch(':id')
  updatePicks(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRosterPicksDto) {
    return this.rostersService.updatePicks(req.user.id, id, dto);
  }

  @Get('league/:leagueId/match-day/:matchDayId')
  findByLeagueAndMatchDay(
    @Param('leagueId') leagueId: string,
    @Param('matchDayId') matchDayId: string,
  ) {
    return this.rostersService.findByLeagueAndMatchDay(leagueId, matchDayId);
  }
}
