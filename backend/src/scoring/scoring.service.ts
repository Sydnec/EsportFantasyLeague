import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IScoringStrategy,
  SCORING_STRATEGIES,
} from './scoring-strategy.interface.js';
import { Game } from '@prisma/client';

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);
  private readonly strategyMap: Map<Game, IScoringStrategy>;

  constructor(
    @Inject(SCORING_STRATEGIES)
    strategies: IScoringStrategy[],
  ) {
    this.strategyMap = new Map(strategies.map((s) => [s.game, s]));
    this.logger.log(
      `Loaded scoring strategies for: ${[...this.strategyMap.keys()].join(', ')}`,
    );
  }

  calculate(game: Game, rawStats: Record<string, unknown>): number {
    const strategy = this.strategyMap.get(game);

    if (!strategy) {
      this.logger.warn(`No scoring strategy found for game: ${game}`);
      return 0;
    }

    return strategy.calculate(rawStats);
  }

  hasStrategy(game: Game): boolean {
    return this.strategyMap.has(game);
  }
}
