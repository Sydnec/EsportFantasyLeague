import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConsumersModule } from './consumers/consumers.module';
import { LeaguesModule } from './leagues/leagues.module';
import { PrismaModule } from './prisma/prisma.module';
import { RostersModule } from './rosters/rosters.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    LeaguesModule,
    ConsumersModule,
    RostersModule,
  ],
  controllers: [],
  providers: [],
})
export class BackendModule {}
