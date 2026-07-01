import { IScoringStrategy } from '../scoring-strategy.interface.js';
export declare class ValorantScoringStrategy implements IScoringStrategy {
    readonly game: "VALORANT";
    calculate(rawStats: Record<string, unknown>): number;
}
