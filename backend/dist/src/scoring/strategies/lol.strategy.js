var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { Game } from '@prisma/client';
let LolScoringStrategy = class LolScoringStrategy {
    game = Game.LEAGUE_OF_LEGENDS;
    calculate(rawStats) {
        let score = 0;
        const kills = Number(rawStats['kills'] ?? 0);
        const deaths = Number(rawStats['deaths'] ?? 0);
        const assists = Number(rawStats['assists'] ?? 0);
        const cs = Number(rawStats['cs'] ?? 0);
        const visionScore = Number(rawStats['visionScore'] ?? 0);
        const firstBlood = Boolean(rawStats['firstBlood']);
        const pentakills = Number(rawStats['pentakills'] ?? 0);
        const damageDealt = Number(rawStats['damageDealt'] ?? 0);
        const wardsPlaced = Number(rawStats['wardsPlaced'] ?? 0);
        const win = Boolean(rawStats['win']);
        score += kills * 3.0;
        score += deaths * -1.0;
        score += assists * 1.5;
        score += cs * 0.02;
        score += visionScore * 0.05;
        score += wardsPlaced * 0.1;
        score += damageDealt * 0.0001;
        if (firstBlood)
            score += 2.0;
        score += pentakills * 10.0;
        if (win)
            score += 5.0;
        return Math.round(score * 100) / 100;
    }
};
LolScoringStrategy = __decorate([
    Injectable()
], LolScoringStrategy);
export { LolScoringStrategy };
//# sourceMappingURL=lol.strategy.js.map