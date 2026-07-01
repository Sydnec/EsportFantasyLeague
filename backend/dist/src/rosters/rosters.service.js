var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException, ForbiddenException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RosterValidationService } from './roster-validation.service.js';
let RostersService = class RostersService {
    prisma;
    auditService;
    validationService;
    constructor(prisma, auditService, validationService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.validationService = validationService;
    }
    async create(userId, dto) {
        const membership = await this.prisma.leagueMember.findUnique({
            where: {
                userId_leagueId: { userId, leagueId: dto.leagueId },
            },
        });
        if (!membership) {
            throw new ForbiddenException('You are not a member of this league');
        }
        await this.validationService.validate(userId, dto.leagueId, dto.matchDayId, dto.proPlayerIds);
        const roster = await this.prisma.$transaction(async (tx) => {
            return tx.roster.create({
                data: {
                    userId,
                    leagueId: dto.leagueId,
                    matchDayId: dto.matchDayId,
                    picks: {
                        create: dto.proPlayerIds.map((proPlayerId, index) => ({
                            proPlayerId,
                            pickOrder: index + 1,
                        })),
                    },
                },
                include: {
                    picks: {
                        include: {
                            proPlayer: {
                                select: { id: true, name: true, team: true, role: true },
                            },
                        },
                    },
                    matchDay: {
                        select: {
                            date: true,
                            game: true,
                            lockTime: true,
                            status: true,
                        },
                    },
                },
            });
        });
        await this.auditService.log(userId, 'ROSTER_CREATED', 'Roster', roster.id, {
            leagueId: dto.leagueId,
            matchDayId: dto.matchDayId,
            proPlayerIds: dto.proPlayerIds,
        });
        return roster;
    }
    async update(userId, rosterId, dto) {
        const roster = await this.prisma.roster.findUnique({
            where: { id: rosterId },
            include: { matchDay: true },
        });
        if (!roster) {
            throw new NotFoundException('Roster not found');
        }
        if (roster.userId !== userId) {
            throw new ForbiddenException('You can only edit your own rosters');
        }
        if (roster.status !== 'PENDING') {
            throw new ForbiddenException('Cannot modify a locked or scored roster');
        }
        await this.validationService.validate(userId, roster.leagueId, roster.matchDayId, dto.proPlayerIds);
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.rosterPick.deleteMany({ where: { rosterId } });
            return tx.roster.update({
                where: { id: rosterId },
                data: {
                    picks: {
                        create: dto.proPlayerIds.map((proPlayerId, index) => ({
                            proPlayerId,
                            pickOrder: index + 1,
                        })),
                    },
                },
                include: {
                    picks: {
                        include: {
                            proPlayer: {
                                select: { id: true, name: true, team: true, role: true },
                            },
                        },
                    },
                    matchDay: {
                        select: {
                            date: true,
                            game: true,
                            lockTime: true,
                            status: true,
                        },
                    },
                },
            });
        });
        await this.auditService.log(userId, 'ROSTER_UPDATED', 'Roster', rosterId, {
            proPlayerIds: dto.proPlayerIds,
        });
        return updated;
    }
    async findUserRosters(userId, leagueId) {
        return this.prisma.roster.findMany({
            where: {
                userId,
                ...(leagueId && { leagueId }),
            },
            include: {
                picks: {
                    include: {
                        proPlayer: {
                            select: {
                                id: true,
                                name: true,
                                team: true,
                                role: true,
                                imageUrl: true,
                            },
                        },
                    },
                    orderBy: { pickOrder: 'asc' },
                },
                matchDay: {
                    select: {
                        id: true,
                        date: true,
                        game: true,
                        status: true,
                        lockTime: true,
                    },
                },
                league: { select: { id: true, name: true } },
            },
            orderBy: { matchDay: { date: 'desc' } },
        });
    }
    async findById(rosterId, userId) {
        const roster = await this.prisma.roster.findUnique({
            where: { id: rosterId },
            include: {
                picks: {
                    include: {
                        proPlayer: {
                            select: {
                                id: true,
                                name: true,
                                team: true,
                                role: true,
                                imageUrl: true,
                            },
                        },
                    },
                    orderBy: { pickOrder: 'asc' },
                },
                matchDay: true,
                league: {
                    select: { id: true, name: true, games: true, tournaments: true },
                },
                user: { select: { id: true, username: true } },
            },
        });
        if (!roster) {
            throw new NotFoundException('Roster not found');
        }
        const isMember = await this.prisma.leagueMember.findUnique({
            where: {
                userId_leagueId: { userId, leagueId: roster.leagueId },
            },
        });
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this league');
        }
        return roster;
    }
    async findLeagueRostersForMatchDay(leagueId, matchDayId, userId) {
        const isMember = await this.prisma.leagueMember.findUnique({
            where: {
                userId_leagueId: { userId, leagueId },
            },
        });
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this league');
        }
        return this.prisma.roster.findMany({
            where: { leagueId, matchDayId },
            include: {
                user: {
                    select: { id: true, username: true, avatarUrl: true },
                },
                picks: {
                    include: {
                        proPlayer: {
                            select: { id: true, name: true, team: true, role: true },
                        },
                    },
                    orderBy: { pickOrder: 'asc' },
                },
            },
            orderBy: { totalScore: { sort: 'desc', nulls: 'last' } },
        });
    }
};
RostersService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        AuditService,
        RosterValidationService])
], RostersService);
export { RostersService };
//# sourceMappingURL=rosters.service.js.map