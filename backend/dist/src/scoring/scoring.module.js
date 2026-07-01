var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service.js';
import { LolScoringStrategy } from './strategies/lol.strategy.js';
import { CsScoringStrategy } from './strategies/cs.strategy.js';
import { ValorantScoringStrategy } from './strategies/valorant.strategy.js';
import { RocketLeagueScoringStrategy } from './strategies/rocket-league.strategy.js';
import { SCORING_STRATEGIES } from './scoring-strategy.interface.js';
let ScoringModule = class ScoringModule {
};
ScoringModule = __decorate([
    Module({
        providers: [
            LolScoringStrategy,
            CsScoringStrategy,
            ValorantScoringStrategy,
            RocketLeagueScoringStrategy,
            {
                provide: SCORING_STRATEGIES,
                useFactory: (lol, cs, val, rl) => [lol, cs, val, rl],
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
], ScoringModule);
export { ScoringModule };
//# sourceMappingURL=scoring.module.js.map