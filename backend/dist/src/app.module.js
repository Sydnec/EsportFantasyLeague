var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
import { DevToolsModule } from './dev-tools/dev-tools.module.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
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
            DevToolsModule,
        ],
        controllers: [AppController],
        providers: [
            {
                provide: APP_GUARD,
                useClass: ThrottlerGuard,
            },
        ],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map