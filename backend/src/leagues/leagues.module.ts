import { Module } from '@nestjs/common';
import { LeaguesService } from './leagues.service.js';
import { LeaguesController } from './leagues.controller.js';

@Module({
  controllers: [LeaguesController],
  providers: [LeaguesService],
  exports: [LeaguesService],
})
export class LeaguesModule {}
