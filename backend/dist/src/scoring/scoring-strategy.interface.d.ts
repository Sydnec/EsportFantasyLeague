import { Game } from '@prisma/client';
export interface IScoringStrategy {
    readonly game: Game;
    calculate(rawStats: Record<string, unknown>): number;
}
export declare const SCORING_STRATEGIES = "SCORING_STRATEGIES";
