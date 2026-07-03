import { Module } from '@nestjs/common';
import { EsportModule } from './esport/esport.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, EsportModule],
  controllers: [],
  providers: [],
})
export class EsportAdapterModule {}
