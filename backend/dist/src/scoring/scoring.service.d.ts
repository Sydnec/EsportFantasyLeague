import { IScoringStrategy } from './scoring-strategy.interface.js';
import { Game } from '@prisma/client';
export declare class ScoringService {
    private readonly logger;
    private readonly strategyMap;
    constructor(strategies: IScoringStrategy[]);
    calculate(game: Game, rawStats: Record<string, unknown>): number;
    hasStrategy(game: Game): boolean;
}
