var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { Game } from '@prisma/client';
let CsScoringStrategy = class CsScoringStrategy {
    game = Game.COUNTER_STRIKE;
    calculate(rawStats) {
        let score = 0;
        const kills = Number(rawStats['kills'] ?? 0);
        const deaths = Number(rawStats['deaths'] ?? 0);
        const assists = Number(rawStats['assists'] ?? 0);
        const headshotKills = Number(rawStats['headshotKills'] ?? 0);
        const clutchRounds = Number(rawStats['clutchRounds'] ?? 0);
        const mvpStars = Number(rawStats['mvpStars'] ?? 0);
        const bombPlants = Number(rawStats['bombPlants'] ?? 0);
        const bombDefusals = Number(rawStats['bombDefusals'] ?? 0);
        const mapWin = Boolean(rawStats['mapWin']);
        score += kills * 3.0;
        score += deaths * -1.0;
        score += assists * 1.0;
        score += headshotKills * 0.5;
        score += clutchRounds * 3.0;
        score += mvpStars * 2.0;
        score += bombPlants * 0.5;
        score += bombDefusals * 1.0;
        if (mapWin)
            score += 5.0;
        return Math.round(score * 100) / 100;
    }
};
CsScoringStrategy = __decorate([
    Injectable()
], CsScoringStrategy);
export { CsScoringStrategy };
//# sourceMappingURL=cs.strategy.js.map