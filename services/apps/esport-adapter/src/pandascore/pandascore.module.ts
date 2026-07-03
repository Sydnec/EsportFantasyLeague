import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PandascoreService } from './pandascore.service';

@Module({
  imports: [HttpModule],
  providers: [PandascoreService],
  exports: [PandascoreService],
})
export class PandascoreModule {}
