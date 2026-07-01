import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service.js';
import { PandaScoreService } from './pandascore.service.js';
import { IngestionController } from './ingestion.controller.js';
import { ScoringModule } from '../scoring/scoring.module.js';

@Module({
  imports: [ScoringModule],
  controllers: [IngestionController],
  providers: [IngestionService, PandaScoreService],
})
export class IngestionModule {}
