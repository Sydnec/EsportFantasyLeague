import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OctaneApiService } from './octane-api.service';

@Module({
  imports: [HttpModule],
  providers: [OctaneApiService],
  exports: [OctaneApiService],
})
export class OctaneModule {}
