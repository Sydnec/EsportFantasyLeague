import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LeaguepediaApiService } from './leaguepedia-api.service';

@Module({
  imports: [HttpModule],
  providers: [LeaguepediaApiService],
  exports: [LeaguepediaApiService],
})
export class LeaguepediaModule {}
