import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service.js';
import { MatchesController } from './matches.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
