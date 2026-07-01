import { Module } from '@nestjs/common';
import { ProPlayersService } from './pro-players.service.js';
import { ProPlayersController } from './pro-players.controller.js';

@Module({
  controllers: [ProPlayersController],
  providers: [ProPlayersService],
  exports: [ProPlayersService],
})
export class ProPlayersModule {}
