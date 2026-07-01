var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { Game } from '@prisma/client';
let RocketLeagueScoringStrategy = class RocketLeagueScoringStrategy {
    game = Game.ROCKET_LEAGUE;
    calculate(rawStats) {
        let score = 0;
        const goals = Number(rawStats['goals'] ?? 0);
        const assists = Number(rawStats['assists'] ?? 0);
        const saves = Number(rawStats['saves'] ?? 0);
        const shots = Number(rawStats['shots'] ?? 0);
        const inGameScore = Number(rawStats['score'] ?? 0);
        const win = Boolean(rawStats['win']);
        score += goals * 4.0;
        score += assists * 2.0;
        score += saves * 3.0;
        score += shots * 1.0;
        score += inGameScore * 0.01;
        if (win)
            score += 5.0;
        return Math.round(score * 100) / 100;
    }
};
RocketLeagueScoringStrategy = __decorate([
    Injectable()
], RocketLeagueScoringStrategy);
export { RocketLeagueScoringStrategy };
//# sourceMappingURL=rocket-league.strategy.js.map