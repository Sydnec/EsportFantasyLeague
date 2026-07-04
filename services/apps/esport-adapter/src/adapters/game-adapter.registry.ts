import { Injectable } from '@nestjs/common';
import { Game } from '@prisma/client-esport';
import { GameAdapter } from './game-adapter.interface';
import { LeagueOfLegendsAdapter } from './league-of-legends.adapter';
import { CounterStrikeAdapter } from './counter-strike.adapter';
import { ValorantAdapter } from './valorant.adapter';
import { RocketLeagueAdapter } from './rocket-league.adapter';

@Injectable()
export class GameAdapterRegistry {
  private readonly adapters: Map<Game, GameAdapter>;

  constructor(
    lol: LeagueOfLegendsAdapter,
    counterStrike: CounterStrikeAdapter,
    valorant: ValorantAdapter,
    rocketLeague: RocketLeagueAdapter,
  ) {
    this.adapters = new Map<Game, GameAdapter>([
      [Game.LEAGUE_OF_LEGENDS, lol],
      [Game.COUNTER_STRIKE, counterStrike],
      [Game.VALORANT, valorant],
      [Game.ROCKET_LEAGUE, rocketLeague],
    ]);
  }

  get(game: Game): GameAdapter {
    const adapter = this.adapters.get(game);
    if (!adapter) {
      throw new Error(`No GameAdapter registered for ${game}`);
    }
    return adapter;
  }

  all(): GameAdapter[] {
    return Array.from(this.adapters.values());
  }
}
