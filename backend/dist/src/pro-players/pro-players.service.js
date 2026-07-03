var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
let ProPlayersService = class ProPlayersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters) {
        return this.prisma.proPlayer.findMany({
            where: {
                isActive: true,
                ...(filters?.game && { game: filters.game }),
                ...(filters?.team && {
                    team: {
                        name: { contains: filters.team, mode: 'insensitive' },
                    },
                }),
                ...(filters?.role && {
                    role: { contains: filters.role, mode: 'insensitive' },
                }),
            },
            include: { team: true },
            orderBy: [{ team: { name: 'asc' } }, { name: 'asc' }],
        });
    }
    async findById(id) {
        const player = await this.prisma.proPlayer.findUnique({
            where: { id },
            include: {
                team: true,
                performances: {
                    orderBy: { matchDay: { date: 'desc' } },
                    take: 10,
                    include: {
                        matchDay: {
                            select: { date: true, game: true, status: true },
                        },
                    },
                },
            },
        });
        if (!player) {
            throw new NotFoundException('Pro player not found');
        }
        return player;
    }
    async findByMatchDay(matchDayId, leagueId) {
        let allowedTournaments = null;
        let isAllSelected = false;
        if (leagueId) {
            const league = await this.prisma.league.findUnique({
                where: { id: leagueId },
                select: { tournaments: true },
            });
            if (league) {
                allowedTournaments = league.tournaments;
            }
        }
        const matchDay = await this.prisma.matchDay.findUnique({
            where: { id: matchDayId },
            include: {
                matches: {
                    select: {
                        teamAId: true,
                        teamBId: true,
                        tournamentName: true,
                    },
                },
            },
        });
        if (!matchDay)
            return [];
        if (allowedTournaments) {
            isAllSelected = allowedTournaments.includes(`ALL:${matchDay.game}`);
        }
        const teamIds = new Set();
        matchDay.matches.forEach((m) => {
            if (allowedTournaments && !isAllSelected) {
                if (!m.tournamentName || !allowedTournaments.includes(m.tournamentName)) {
                    return;
                }
            }
            teamIds.add(m.teamAId);
            teamIds.add(m.teamBId);
        });
        const teamIdsArray = Array.from(teamIds);
        return this.prisma.proPlayer.findMany({
            where: {
                isActive: true,
                game: matchDay.game,
                teamId: { in: teamIdsArray },
            },
            include: {
                team: true,
                performances: {
                    where: { matchDayId },
                    select: { id: true, score: true },
                },
            },
        });
    }
};
ProPlayersService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ProPlayersService);
export { ProPlayersService };
//# sourceMappingURL=pro-players.service.js.map