import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EsportModule } from './esport/esport.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, EsportModule],
  controllers: [],
  providers: [],
})
export class EsportAdapterModule {}
