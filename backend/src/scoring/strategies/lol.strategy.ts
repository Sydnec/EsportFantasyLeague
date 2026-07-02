import { Injectable } from '@nestjs/common';
import { IScoringStrategy } from '../scoring-strategy.interface.js';
import { Game } from '@prisma/client';

/**
 * League of Legends Scoring Strategy
 *
 * Kills: +3.0 | Deaths: -1.0 | Assists: +1.5
 * CS: +0.02/cs | Vision Score: +0.05/pt | Wards Placed: +0.1/ward
 * Damage Dealt: +0.0001/pt (1 pt per 10k)
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
    if (firstBlood) score += 2.0;
    score += pentakills * 10.0;
    if (win) score += 5.0;

    return Math.round(score * 100) / 100;
  }
}
