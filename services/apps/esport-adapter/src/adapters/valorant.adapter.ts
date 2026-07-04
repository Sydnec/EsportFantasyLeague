import { Injectable } from '@nestjs/common';
import { Game } from '@prisma/client-esport';
import { BasePandascoreAdapter } from './base-pandascore.adapter';
import { DetailedPerformancesResult, PlayerRef, StoredMatchRef } from './game-adapter.interface';
import { VlrApiService } from '../vlr/vlr-api.service';
import { PANDASCORE_GAME_SLUGS } from '../pandascore/pandascore.constants';

@Injectable()
export class ValorantAdapter extends BasePandascoreAdapter {
  readonly game = Game.VALORANT;
  readonly pandascoreSlug = PANDASCORE_GAME_SLUGS[Game.VALORANT];
  readonly supportsLiveGames = true;

  constructor(private readonly vlr: VlrApiService) {
    super();
  }

  fetchDetailedPerformances(match: StoredMatchRef, players: PlayerRef[]): Promise<DetailedPerformancesResult> {
    return this.vlr.getMatchPerformances(match.id, match.teamAName, match.teamBName, match.scheduledAt, players);
  }
}
