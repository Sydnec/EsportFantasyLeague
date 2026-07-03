import { Module } from '@nestjs/common';
import { EsportAdapterController } from './esport-adapter.controller';
import { EsportAdapterService } from './esport-adapter.service';

@Module({
  imports: [],
  controllers: [EsportAdapterController],
  providers: [EsportAdapterService],
})
export class EsportAdapterModule {}
