import { Game } from '@prisma/client';

export interface IScoringStrategy {
  readonly game: Game;
  calculate(rawStats: Record<string, unknown>): number;
}

export const SCORING_STRATEGIES = 'SCORING_STRATEGIES';
