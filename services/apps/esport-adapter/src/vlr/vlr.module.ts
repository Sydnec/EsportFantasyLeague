import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VlrApiService } from './vlr-api.service';

@Module({
  imports: [HttpModule],
  providers: [VlrApiService],
  exports: [VlrApiService],
})
export class VlrModule {}
