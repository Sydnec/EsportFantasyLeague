import { IScoringStrategy } from '../scoring-strategy.interface.js';
export declare class LolScoringStrategy implements IScoringStrategy {
    readonly game: "LEAGUE_OF_LEGENDS";
    calculate(rawStats: Record<string, unknown>): number;
}
