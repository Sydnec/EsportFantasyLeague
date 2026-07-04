import { Module } from '@nestjs/common';
import { LeaguepediaModule } from '../leaguepedia/leaguepedia.module';
import { OctaneModule } from '../octane/octane.module';
import { VlrModule } from '../vlr/vlr.module';
import { LeagueOfLegendsAdapter } from './league-of-legends.adapter';
import { CounterStrikeAdapter } from './counter-strike.adapter';
import { ValorantAdapter } from './valorant.adapter';
import { RocketLeagueAdapter } from './rocket-league.adapter';
import { GameAdapterRegistry } from './game-adapter.registry';

@Module({
  imports: [LeaguepediaModule, OctaneModule, VlrModule],
  providers: [LeagueOfLegendsAdapter, CounterStrikeAdapter, ValorantAdapter, RocketLeagueAdapter, GameAdapterRegistry],
  exports: [GameAdapterRegistry],
})
export class AdaptersModule {}
