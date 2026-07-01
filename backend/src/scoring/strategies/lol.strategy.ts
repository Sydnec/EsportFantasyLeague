import { Injectable } from '@nestjs/common';
import { IScoringStrategy } from '../scoring-strategy.interface.js';
import { Game } from '@prisma/client';

/**
 * League of Legends Scoring Strategy
 *
 * Kills: +3.0 | Deaths: -1.0 | Assists: +1.5
 * CS: +0.01/cs | Vision Score: +0.05/pt
 * First Blood: +2.0 | Pentakill: +10.0 | Win: +5.0
 */
@Injectable()
export class LolScoringStrategy implements IScoringStrategy {
  readonly game = Game.LEAGUE_OF_LEGENDS;

  calculate(rawStats: Record<string, unknown>): number {
    let score = 0;

    const kills = Number(rawStats['kills'] ?? 0);
    const deaths = Number(rawStats['deaths'] ?? 0);
    const assists = Number(rawStats['assists'] ?? 0);
    const cs = Number(rawStats['cs'] ?? 0);
    const visionScore = Number(rawStats['visionScore'] ?? 0);
    const firstBlood = Boolean(rawStats['firstBlood']);
    const pentakills = Number(rawStats['pentakills'] ?? 0);
    const win = Boolean(rawStats['win']);

    score += kills * 3.0;
    score += deaths * -1.0;
    score += assists * 1.5;
    score += cs * 0.01;
    score += visionScore * 0.05;
    if (firstBlood) score += 2.0;
    score += pentakills * 10.0;
    if (win) score += 5.0;

    return Math.round(score * 100) / 100;
  }
}
