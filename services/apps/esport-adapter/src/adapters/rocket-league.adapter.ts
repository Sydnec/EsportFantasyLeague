import { Injectable } from '@nestjs/common';
import { Game } from '@prisma/client-esport';
import { BasePandascoreAdapter } from './base-pandascore.adapter';
import { DetailedPerformancesResult, PlayerRef, StoredMatchRef } from './game-adapter.interface';
import { OctaneApiService } from '../octane/octane-api.service';
import { PANDASCORE_GAME_SLUGS } from '../pandascore/pandascore.constants';

@Injectable()
export class RocketLeagueAdapter extends BasePandascoreAdapter {
  readonly game = Game.ROCKET_LEAGUE;
  readonly pandascoreSlug = PANDASCORE_GAME_SLUGS[Game.ROCKET_LEAGUE];

  constructor(private readonly octane: OctaneApiService) {
    super();
  }

  async fetchDetailedPerformances(match: StoredMatchRef, players: PlayerRef[]): Promise<DetailedPerformancesResult> {
    const performances = await this.octane.getMatchPerformances(
      match.id,
      match.teamAName,
      match.teamBName,
      match.scheduledAt,
      players,
    );
    return { performances };
  }
}
