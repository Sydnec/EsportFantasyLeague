import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service.js';
import { LolScoringStrategy } from './strategies/lol.strategy.js';
import { CsScoringStrategy } from './strategies/cs.strategy.js';
import { ValorantScoringStrategy } from './strategies/valorant.strategy.js';
import { RocketLeagueScoringStrategy } from './strategies/rocket-league.strategy.js';
import { SCORING_STRATEGIES } from './scoring-strategy.interface.js';

@Module({
  providers: [
    LolScoringStrategy,
    CsScoringStrategy,
    ValorantScoringStrategy,
    RocketLeagueScoringStrategy,
    {
      provide: SCORING_STRATEGIES,
      useFactory: (
        lol: LolScoringStrategy,
        cs: CsScoringStrategy,
        val: ValorantScoringStrategy,
        rl: RocketLeagueScoringStrategy,
      ) => [lol, cs, val, rl],
      inject: [
        LolScoringStrategy,
        CsScoringStrategy,
        ValorantScoringStrategy,
        RocketLeagueScoringStrategy,
      ],
    },
    ScoringService,
  ],
  exports: [ScoringService],
})
export class ScoringModule {}
