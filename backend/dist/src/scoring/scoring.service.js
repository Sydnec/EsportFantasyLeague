var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ScoringService_1;
import { Injectable, Inject, Logger } from '@nestjs/common';
import { SCORING_STRATEGIES, } from './scoring-strategy.interface.js';
let ScoringService = ScoringService_1 = class ScoringService {
    logger = new Logger(ScoringService_1.name);
    strategyMap;
    constructor(strategies) {
        this.strategyMap = new Map(strategies.map((s) => [s.game, s]));
        this.logger.log(`Loaded scoring strategies for: ${[...this.strategyMap.keys()].join(', ')}`);
    }
    calculate(game, rawStats) {
        const strategy = this.strategyMap.get(game);
        if (!strategy) {
            this.logger.warn(`No scoring strategy found for game: ${game}`);
            return 0;
        }
        return strategy.calculate(rawStats);
    }
    hasStrategy(game) {
        return this.strategyMap.has(game);
    }
};
ScoringService = ScoringService_1 = __decorate([
    Injectable(),
    __param(0, Inject(SCORING_STRATEGIES)),
    __metadata("design:paramtypes", [Array])
], ScoringService);
export { ScoringService };
//# sourceMappingURL=scoring.service.js.map