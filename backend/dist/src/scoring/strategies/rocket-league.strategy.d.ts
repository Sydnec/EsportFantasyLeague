import { IScoringStrategy } from '../scoring-strategy.interface.js';
export declare class RocketLeagueScoringStrategy implements IScoringStrategy {
    readonly game: "ROCKET_LEAGUE";
    calculate(rawStats: Record<string, unknown>): number;
}
