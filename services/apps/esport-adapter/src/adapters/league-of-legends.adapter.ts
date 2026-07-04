import { Injectable } from '@nestjs/common';
import { Game } from '@prisma/client-esport';
import { BasePandascoreAdapter } from './base-pandascore.adapter';
import { DetailedPerformancesResult, PlayerRef, StoredMatchRef } from './game-adapter.interface';
import { LeaguepediaApiService } from '../leaguepedia/leaguepedia-api.service';
import { PANDASCORE_GAME_SLUGS } from '../pandascore/pandascore.constants';

@Injectable()
export class LeagueOfLegendsAdapter extends BasePandascoreAdapter {
  readonly game = Game.LEAGUE_OF_LEGENDS;
  readonly pandascoreSlug = PANDASCORE_GAME_SLUGS[Game.LEAGUE_OF_LEGENDS];
  // Down to LFL (tier 'c'); excludes tier 'd' feeder/amateur leagues (e.g. LFL Division 2).
  protected readonly allowedTiers = ['s', 'a', 'b', 'c'];
  readonly supportsLiveGames = true;

  constructor(private readonly leaguepedia: LeaguepediaApiService) {
    super();
  }

  fetchDetailedPerformances(match: StoredMatchRef, players: PlayerRef[]): Promise<DetailedPerformancesResult> {
    return this.leaguepedia.getMatchPerformances(match.id, match.teamAName, match.teamBName, match.scheduledAt, players);
  }
}
