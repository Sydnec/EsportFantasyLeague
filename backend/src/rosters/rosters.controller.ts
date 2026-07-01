import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RostersService } from './rosters.service.js';
import { CreateRosterDto } from './dto/create-roster.dto.js';
import { UpdateRosterDto } from './dto/update-roster.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator.js';

@Controller('rosters')
@UseGuards(JwtAuthGuard)
export class RostersController {
  constructor(private rostersService: RostersService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateRosterDto) {
    return this.rostersService.create(user.userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('leagueId') leagueId?: string,
  ) {
    return this.rostersService.findUserRosters(user.userId, leagueId);
  }

  @Get('league/:leagueId/match-day/:matchDayId')
  findByLeagueAndMatchDay(
    @Param('leagueId') leagueId: string,
    @Param('matchDayId') matchDayId: string,
  ) {
    return this.rostersService.findLeagueRostersForMatchDay(
      leagueId,
      matchDayId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rostersService.findById(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRosterDto,
  ) {
    return this.rostersService.update(user.userId, id, dto);
  }
}
