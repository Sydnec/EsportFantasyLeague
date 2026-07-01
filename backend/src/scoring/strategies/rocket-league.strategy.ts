import { Injectable } from '@nestjs/common';
import { IScoringStrategy } from '../scoring-strategy.interface.js';
import { Game } from '@prisma/client';

/**
 * Rocket League Scoring Strategy
 *
 * Goals: +4.0 | Assists: +2.0 | Saves: +3.0
 * Shots: +1.0 | Score: +0.01 per point
 * Win: +5.0
 */
@Injectable()
export class RocketLeagueScoringStrategy implements IScoringStrategy {
  readonly game = Game.ROCKET_LEAGUE;

  calculate(rawStats: Record<string, unknown>): number {
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
    if (win) score += 5.0;

    return Math.round(score * 100) / 100;
  }
}
