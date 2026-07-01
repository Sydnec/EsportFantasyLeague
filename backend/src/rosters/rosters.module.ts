import { Module } from '@nestjs/common';
import { RostersService } from './rosters.service.js';
import { RostersController } from './rosters.controller.js';
import { RosterValidationService } from './roster-validation.service.js';

@Module({
  controllers: [RostersController],
  providers: [RostersService, RosterValidationService],
  exports: [RostersService],
})
export class RostersModule {}
