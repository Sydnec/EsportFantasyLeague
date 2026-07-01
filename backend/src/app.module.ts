import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { AuditModule } from './audit/audit.module.js';
import { LeaguesModule } from './leagues/leagues.module.js';
import { ProPlayersModule } from './pro-players/pro-players.module.js';
import { MatchDaysModule } from './match-days/match-days.module.js';
import { ScoringModule } from './scoring/scoring.module.js';
import { RostersModule } from './rosters/rosters.module.js';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { IngestionModule } from './ingestion/ingestion.module.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 100 requests per minute
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    LeaguesModule,
    ProPlayersModule,
    MatchDaysModule,
    ScoringModule,
    RostersModule,
    IngestionModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
