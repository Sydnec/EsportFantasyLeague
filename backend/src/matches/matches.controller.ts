import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchesService.findById(id);
  }
}
