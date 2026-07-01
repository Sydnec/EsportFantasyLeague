import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service.js';
import { LolScoringStrategy } from './strategies/lol.strategy.js';
import { CsScoringStrategy } from './strategies/cs.strategy.js';
import { SCORING_STRATEGIES } from './scoring-strategy.interface.js';

@Module({
  providers: [
    LolScoringStrategy,
    CsScoringStrategy,
    {
      provide: SCORING_STRATEGIES,
      useFactory: (lol: LolScoringStrategy, cs: CsScoringStrategy) => [lol, cs],
      inject: [LolScoringStrategy, CsScoringStrategy],
    },
    ScoringService,
  ],
  exports: [ScoringService],
})
export class ScoringModule {}
