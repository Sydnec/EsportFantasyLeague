import { Injectable } from '@nestjs/common';
import { Game } from '@prisma/client-esport';
import { BasePandascoreAdapter } from './base-pandascore.adapter';
import { DetailedPerformancesResult, PlayerRef, StoredMatchRef } from './game-adapter.interface';
import { PANDASCORE_GAME_SLUGS } from '../pandascore/pandascore.constants';

/**
 * No specialized stats API wired up yet for Counter-Strike — falls back to
 * whatever Pandascore's own `games` (per-map) breakdown provides. Plan is to
 * wire up GRID.gg Open Access (free official CS2 data) here once credentials
 * are available; not done yet.
 */
@Injectable()
export class CounterStrikeAdapter extends BasePandascoreAdapter {
  readonly game = Game.COUNTER_STRIKE;
  readonly pandascoreSlug = PANDASCORE_GAME_SLUGS[Game.COUNTER_STRIKE];
  // "Tier 1" in the community sense: Majors, ESL Pro League, BLAST Premier, IEM...
  protected readonly allowedTiers = ['s', 'a'];

  fetchDetailedPerformances(match: StoredMatchRef, players: PlayerRef[]): Promise<DetailedPerformancesResult> {
    return Promise.resolve({ performances: this.extractStatsFromGames(match.games, players) });
  }
}
