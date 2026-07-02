var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { Game } from '@prisma/client';
let ValorantScoringStrategy = class ValorantScoringStrategy {
    game = Game.VALORANT;
    calculate(rawStats) {
        let score = 0;
        const kills = Number(rawStats['kills'] ?? 0);
        const deaths = Number(rawStats['deaths'] ?? 0);
        const assists = Number(rawStats['assists'] ?? 0);
        const firstBloods = Number(rawStats['firstBloods'] ?? 0);
        const headshots = Number(rawStats['headshots'] ?? 0);
        const acs = Number(rawStats['acs'] ?? 0);
        const kast = Number(rawStats['kast'] ?? 0);
        const win = Boolean(rawStats['win']);
        score += kills * 2.0;
        score += deaths * -1.0;
        score += assists * 1.0;
        score += firstBloods * 3.0;
        score += headshots * 0.5;
        score += acs * 0.01;
        score += kast * 0.1;
        if (win)
            score += 5.0;
        return Math.round(score * 100) / 100;
    }
};
ValorantScoringStrategy = __decorate([
    Injectable()
], ValorantScoringStrategy);
export { ValorantScoringStrategy };
//# sourceMappingURL=valorant.strategy.js.map