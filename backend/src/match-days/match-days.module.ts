import { Module } from '@nestjs/common';
import { MatchDaysService } from './match-days.service.js';
import { MatchDaysController } from './match-days.controller.js';

@Module({
  controllers: [MatchDaysController],
  providers: [MatchDaysService],
  exports: [MatchDaysService],
})
export class MatchDaysModule {}
