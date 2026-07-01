import { Controller, Post, UseGuards } from '@nestjs/common';
import { PandaScoreService } from './pandascore.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Game, Role } from '@prisma/client';

@Controller('ingestion')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class IngestionController {
  constructor(private pandascoreService: PandaScoreService) {}

  @Post('matches/sync')
  async syncMatches() {
    // In a real application, this might be triggered by a cron job
    // or limited to admin users. For now, we sync LoL matches.
    await this.pandascoreService.syncUpcomingMatches(Game.LEAGUE_OF_LEGENDS);
    return { success: true, message: 'Sync triggered successfully' };
  }
}
