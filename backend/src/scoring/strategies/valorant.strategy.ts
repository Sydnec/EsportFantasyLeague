import { Injectable } from '@nestjs/common';
import { IScoringStrategy } from '../scoring-strategy.interface.js';
import { Game } from '@prisma/client';

/**
 * Valorant Scoring Strategy
 *
 * Kills: +2.0 | Deaths: -1.0 | Assists: +1.0
 * First Bloods: +3.0 | Headshots: +0.5
 * ACS (Average Combat Score): +0.01 per point
 * KAST: +0.1 per point
 * Win: +5.0
 */
@Injectable()
export class ValorantScoringStrategy implements IScoringStrategy {
  readonly game = Game.VALORANT;

  calculate(rawStats: Record<string, unknown>): number {
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
    if (win) score += 5.0;

    return Math.round(score * 100) / 100;
  }
}
