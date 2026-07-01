var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException, ConflictException, ForbiddenException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { nanoid } from 'nanoid';
let LeaguesService = class LeaguesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUpcomingTournaments() {
        const now = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        const matches = await this.prisma.match.findMany({
            where: {
                scheduledAt: {
                    gte: now,
                    lte: thirtyDaysLater,
                },
                tournamentName: {
                    not: null,
                },
            },
            select: {
                tournamentName: true,
                matchDay: {
                    select: {
                        game: true,
                    },
                },
            },
        });
        const grouped = {};
        matches.forEach((m) => {
            const game = m.matchDay.game;
            const tName = m.tournamentName;
            if (tName && tName.trim() !== '') {
                if (!grouped[game])
                    grouped[game] = [];
                if (!grouped[game].includes(tName)) {
                    grouped[game].push(tName);
                }
            }
        });
        return grouped;
    }
    async create(userId, dto) {
        const inviteCode = nanoid(10);
        const league = await this.prisma.league.create({
            data: {
                ...dto,
                inviteCode,
                createdById: userId,
                members: {
                    create: { userId },
                },
            },
            include: { members: true },
        });
        return league;
    }
    async findUserLeagues(userId) {
        return this.prisma.league.findMany({
            where: {
                members: { some: { userId } },
            },
            include: {
                members: {
                    select: {
                        id: true,
                        totalScore: true,
                        user: {
                            select: { id: true, username: true, avatarUrl: true },
                        },
                    },
                    orderBy: { totalScore: 'desc' },
                },
                _count: { select: { members: true } },
            },
        });
    }
    async findById(leagueId) {
        const league = await this.prisma.league.findUnique({
            where: { id: leagueId },
            include: {
                members: {
                    select: {
                        id: true,
                        totalScore: true,
                        joinedAt: true,
                        user: {
                            select: { id: true, username: true, avatarUrl: true },
                        },
                    },
                    orderBy: { totalScore: 'desc' },
                },
            },
        });
        if (!league) {
            throw new NotFoundException('League not found');
        }
        return league;
    }
    async join(userId, inviteCode) {
        const league = await this.prisma.league.findUnique({
            where: { inviteCode },
            include: { _count: { select: { members: true } } },
        });
        if (!league) {
            throw new NotFoundException('Invalid invite code');
        }
        if (league._count.members >= league.maxMembers) {
            throw new ForbiddenException('League is full');
        }
        const existingMember = await this.prisma.leagueMember.findUnique({
            where: {
                userId_leagueId: { userId, leagueId: league.id },
            },
        });
        if (existingMember) {
            throw new ConflictException('Already a member of this league');
        }
        await this.prisma.leagueMember.create({
            data: { userId, leagueId: league.id },
        });
        return this.findById(league.id);
    }
    async getLeaderboard(leagueId) {
        return this.prisma.leagueMember.findMany({
            where: { leagueId },
            select: {
                id: true,
                totalScore: true,
                user: {
                    select: { id: true, username: true, avatarUrl: true },
                },
            },
            orderBy: { totalScore: 'desc' },
        });
    }
    async remove(userId, leagueId) {
        const league = await this.prisma.league.findUnique({
            where: { id: leagueId },
        });
        if (!league) {
            throw new NotFoundException('League not found');
        }
        if (league.createdById !== userId) {
            throw new ForbiddenException('Only the creator can delete this league');
        }
        return this.prisma.league.delete({
            where: { id: leagueId },
        });
    }
};
LeaguesService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], LeaguesService);
export { LeaguesService };
//# sourceMappingURL=leagues.service.js.map