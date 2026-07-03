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
let MatchesService = class MatchesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const match = await this.prisma.match.findUnique({
            where: { id },
            include: {
                teamA: {
                    include: { players: { where: { isActive: true } } }
                },
                teamB: {
                    include: { players: { where: { isActive: true } } }
                },
                winner: true,
                matchDay: {
                    include: {
                        performances: {
                            include: {
                                proPlayer: {
                                    select: { id: true, name: true, team: true, role: true, imageUrl: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!match) {
            throw new NotFoundException('Match not found');
        }
        const relevantTeamIds = [match.teamAId, match.teamBId];
        const filteredPerformances = match.matchDay.performances.filter(p => p.proPlayer.team && relevantTeamIds.includes(p.proPlayer.team.id));
        return {
            ...match,
            matchDay: {
                ...match.matchDay,
                performances: filteredPerformances,
            },
        };
    }
};
MatchesService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], MatchesService);
export { MatchesService };
//# sourceMappingURL=matches.service.js.map