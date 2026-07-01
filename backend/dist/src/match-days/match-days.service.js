var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MatchDaysService_1;
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { MatchDayStatus } from '@prisma/client';
let MatchDaysService = MatchDaysService_1 = class MatchDaysService {
    prisma;
    logger = new Logger(MatchDaysService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters) {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() - 2);
        minDate.setHours(0, 0, 0, 0);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 7);
        maxDate.setHours(23, 59, 59, 999);
        return this.prisma.matchDay.findMany({
            where: {
                ...(filters?.game && { game: filters.game }),
                ...(filters?.status && { status: filters.status }),
                ...(filters?.date
                    ? { date: new Date(filters.date) }
                    : {
                        date: { gte: minDate, lte: maxDate },
                    }),
            },
            include: {
                _count: { select: { performances: true, rosters: true } },
                matches: {
                    include: { teamA: true, teamB: true },
                    orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
                },
            },
            orderBy: { date: 'asc' },
        });
    }
    async findById(id) {
        const matchDay = await this.prisma.matchDay.findUnique({
            where: { id },
            include: {
                performances: {
                    include: {
                        proPlayer: {
                            select: { id: true, name: true, team: true, role: true },
                        },
                    },
                    orderBy: { score: { sort: 'desc', nulls: 'last' } },
                },
                matches: {
                    include: { teamA: true, teamB: true },
                    orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
                },
            },
        });
        if (!matchDay) {
            throw new NotFoundException('Match day not found');
        }
        return matchDay;
    }
    async autoLockMatchDays() {
        const now = new Date();
        const result = await this.prisma.matchDay.updateMany({
            where: {
                status: MatchDayStatus.OPEN,
                lockTime: { lte: now },
            },
            data: { status: MatchDayStatus.LOCKED },
        });
        if (result.count > 0) {
            this.logger.log(`Auto-locked ${result.count} match day(s)`);
            await this.prisma.roster.updateMany({
                where: {
                    status: 'PENDING',
                    matchDay: {
                        status: MatchDayStatus.LOCKED,
                    },
                },
                data: { status: 'LOCKED' },
            });
        }
    }
};
__decorate([
    Cron(CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MatchDaysService.prototype, "autoLockMatchDays", null);
MatchDaysService = MatchDaysService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], MatchDaysService);
export { MatchDaysService };
//# sourceMappingURL=match-days.service.js.map