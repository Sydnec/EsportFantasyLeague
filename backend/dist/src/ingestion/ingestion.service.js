var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IngestionService_1;
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { ScoringService } from '../scoring/scoring.service.js';
import { PandaScoreService } from './pandascore.service.js';
import { MatchDayStatus, Game } from '@prisma/client';
let IngestionService = IngestionService_1 = class IngestionService {
    prisma;
    scoringService;
    pandaScoreService;
    logger = new Logger(IngestionService_1.name);
    lastSyncTimes = new Map();
    constructor(prisma, scoringService, pandaScoreService) {
        this.prisma = prisma;
        this.scoringService = scoringService;
        this.pandaScoreService = pandaScoreService;
    }
    async onModuleInit() {
        this.logger.log('Running initial sync on startup...');
        await this.syncPandaScoreMatches();
    }
    async syncPandaScoreMatches() {
        this.logger.log('Starting big PandaScore synchronization...');
        for (const game of Object.values(Game)) {
            this.logger.log(`Syncing matches for ${game}...`);
            await this.pandaScoreService.syncUpcomingMatches(game);
        }
        this.logger.log('Finished big PandaScore synchronization. Launching point calculation...');
        await this.processLockedMatchDays();
    }
    async syncLiveMatchScores() {
        for (const game of Object.values(Game)) {
            const hasActiveMatches = await this.pandaScoreService.hasActiveMatches(game);
            const lastSync = this.lastSyncTimes.get(game) || 0;
            const timeSinceLastSync = Date.now() - lastSync;
            const tenMinutes = 10 * 60 * 1000;
            if (hasActiveMatches || timeSinceLastSync >= tenMinutes) {
                if (!hasActiveMatches) {
                    this.logger.debug(`Fallback sync for ${game} (no sync in 10m)`);
                }
                await this.pandaScoreService.syncRunningMatches(game);
                this.lastSyncTimes.set(game, Date.now());
            }
        }
    }
    async processLockedMatchDays() {
        const lockedMatchDays = await this.prisma.matchDay.findMany({
            where: { status: MatchDayStatus.LOCKED },
            include: {
                performances: {
                    where: { score: null },
                },
            },
        });
        for (const matchDay of lockedMatchDays) {
            const matches = await this.prisma.match.findMany({
                where: { matchDayId: matchDay.id },
            });
            const allMatchesFinished = matches.length > 0 && matches.every((m) => m.status === 'finished');
            if (!allMatchesFinished) {
                continue;
            }
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const allFinishedForOneHour = matches.every((m) => m.finishedAt && m.finishedAt <= oneHourAgo);
            if (!allFinishedForOneHour) {
                continue;
            }
            const unscoredPerformances = matchDay.performances.filter((p) => p.score === null);
            if (unscoredPerformances.length === 0) {
                await this.finalizeMatchDay(matchDay.id);
                continue;
            }
            this.logger.log(`Scoring ${unscoredPerformances.length} performances for match day ${matchDay.id}`);
            for (const perf of unscoredPerformances) {
                const score = this.scoringService.calculate(matchDay.game, perf.rawStats);
                await this.prisma.dayPerformance.update({
                    where: { id: perf.id },
                    data: { score },
                });
            }
            await this.finalizeMatchDay(matchDay.id);
        }
    }
    async finalizeMatchDay(matchDayId) {
        const targetMatchDay = await this.prisma.matchDay.findUnique({
            where: { id: matchDayId },
            select: { date: true },
        });
        if (!targetMatchDay)
            return;
        await this.prisma.matchDay.update({
            where: { id: matchDayId },
            data: { status: 'SCORED' },
        });
        const allMdsOnDate = await this.prisma.matchDay.findMany({
            where: { date: targetMatchDay.date },
        });
        const allScored = allMdsOnDate.every((md) => md.status === 'SCORED');
        if (!allScored) {
            this.logger.log(`Match day ${matchDayId} marked as SCORED. Waiting for sibling games on date ${targetMatchDay.date.toISOString().split('T')[0]} to finalize before scoring rosters.`);
            return;
        }
        const siblingMdIds = allMdsOnDate.map((md) => md.id);
        const rosters = await this.prisma.roster.findMany({
            where: {
                matchDayId: { in: siblingMdIds },
                status: { not: 'SCORED' },
            },
            include: {
                picks: {
                    include: {
                        proPlayer: {
                            include: {
                                performances: {
                                    where: { matchDayId: { in: siblingMdIds } },
                                    select: { score: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        for (const roster of rosters) {
            const totalScore = roster.picks.reduce((sum, pick) => {
                const perf = pick.proPlayer.performances[0];
                return sum + (perf?.score ?? 0);
            }, 0);
            const roundedScore = Math.round(totalScore * 100) / 100;
            await this.prisma.roster.update({
                where: { id: roster.id },
                data: {
                    totalScore: roundedScore,
                    status: 'SCORED',
                },
            });
            await this.prisma.leagueMember.update({
                where: {
                    userId_leagueId: {
                        userId: roster.userId,
                        leagueId: roster.leagueId,
                    },
                },
                data: {
                    totalScore: { increment: roundedScore },
                },
            });
        }
        this.logger.log(`All match days on date ${targetMatchDay.date.toISOString().split('T')[0]} finalized. Scored ${rosters.length} rosters.`);
    }
};
__decorate([
    Cron('0 */2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IngestionService.prototype, "syncPandaScoreMatches", null);
__decorate([
    Cron('* * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IngestionService.prototype, "syncLiveMatchScores", null);
__decorate([
    Cron(CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IngestionService.prototype, "processLockedMatchDays", null);
IngestionService = IngestionService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        ScoringService,
        PandaScoreService])
], IngestionService);
export { IngestionService };
//# sourceMappingURL=ingestion.service.js.map