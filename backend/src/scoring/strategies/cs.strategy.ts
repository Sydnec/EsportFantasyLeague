import { Injectable } from '@nestjs/common';
import { IScoringStrategy } from '../scoring-strategy.interface.js';
import { Game } from '@prisma/client';

/**
 * Counter-Strike Scoring Strategy
 *
 * Kills: +3.0 | Deaths: -1.0 | Assists: +1.0
 * Headshot kills: +0.5 bonus | Clutch rounds: +3.0
 * MVP stars: +2.0 | Bomb plants: +0.5 | Bomb defusals: +1.0
 * KAST: +0.1 per point (e.g., 80 KAST = +8.0 pts)
 * Map win: +5.0
 */
@Injectable()
export class CsScoringStrategy implements IScoringStrategy {
  readonly game = Game.COUNTER_STRIKE;

  calculate(rawStats: Record<string, unknown>): number {
    let score = 0;

    const kills = Number(rawStats['kills'] ?? 0);
    const deaths = Number(rawStats['deaths'] ?? 0);
    const assists = Number(rawStats['assists'] ?? 0);
    const headshotKills = Number(rawStats['headshotKills'] ?? 0);
    const clutchRounds = Number(rawStats['clutchRounds'] ?? 0);
    const mvpStars = Number(rawStats['mvpStars'] ?? 0);
    const bombPlants = Number(rawStats['bombPlants'] ?? 0);
    const bombDefusals = Number(rawStats['bombDefusals'] ?? 0);
    const kast = Number(rawStats['kast'] ?? 0);
    const mapWin = Boolean(rawStats['mapWin']);

    score += kills * 3.0;
    score += deaths * -1.0;
    score += assists * 1.0;
    score += headshotKills * 0.5;
    score += clutchRounds * 3.0;
    score += mvpStars * 2.0;
    score += bombPlants * 0.5;
    score += bombDefusals * 1.0;
    score += kast * 0.1;
    if (mapWin) score += 5.0;

    return Math.round(score * 100) / 100;
  }
}
