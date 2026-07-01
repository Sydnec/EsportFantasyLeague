import { IScoringStrategy } from '../scoring-strategy.interface.js';
export declare class CsScoringStrategy implements IScoringStrategy {
    readonly game: "COUNTER_STRIKE";
    calculate(rawStats: Record<string, unknown>): number;
}
