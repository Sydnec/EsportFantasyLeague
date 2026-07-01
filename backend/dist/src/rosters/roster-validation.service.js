var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, BadRequestException, ForbiddenException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
let RosterValidationService = class RosterValidationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validate(userId, leagueId, matchDayId, proPlayerIds) {
        const league = await this.prisma.league.findUnique({
            where: { id: leagueId },
        });
        if (!league) {
            throw new BadRequestException('League not found');
        }
        if (proPlayerIds.length !== league.rosterSize) {
            throw new BadRequestException(`Roster must have exactly ${league.rosterSize} players, got ${proPlayerIds.length}`);
        }
        const uniqueIds = new Set(proPlayerIds);
        if (uniqueIds.size !== proPlayerIds.length) {
            throw new BadRequestException('Duplicate players in roster');
        }
        const matchDay = await this.prisma.matchDay.findUnique({
            where: { id: matchDayId },
            include: {
                matches: { select: { scheduledAt: true, tournamentName: true } },
            },
        });
        if (!matchDay) {
            throw new BadRequestException('Match day not found');
        }
        if (!league.games.includes(matchDay.game)) {
            throw new BadRequestException('Match day game does not match league game');
        }
        const isAllSelected = league.tournaments.includes(`ALL:${matchDay.game}`);
        const relevantMatches = matchDay.matches.filter((m) => {
            if (isAllSelected)
                return true;
            return league.tournaments.includes(m.tournamentName ?? '');
        });
        if (relevantMatches.length === 0) {
            throw new BadRequestException('No relevant matches for this league on this day');
        }
        const earliestMatchTime = relevantMatches
            .map((m) => new Date(m.scheduledAt).getTime())
            .sort((a, b) => a - b)[0];
        const effectiveLockTime = new Date(earliestMatchTime - 60 * 60 * 1000);
        if (new Date() >= effectiveLockTime) {
            throw new ForbiddenException('Match day is locked for this league — rosters can no longer be modified');
        }
        const siblingMds = await this.prisma.matchDay.findMany({
            where: {
                date: matchDay.date,
                game: { in: league.games },
            },
            select: { id: true, game: true },
        });
        const siblingMdIds = siblingMds.map((m) => m.id);
        const siblingGames = siblingMds.map((m) => m.game);
        const matches = await this.prisma.match.findMany({
            where: { matchDayId: { in: siblingMdIds } },
            select: { teamAId: true, teamBId: true },
        });
        const teamIds = new Set();
        matches.forEach((m) => {
            teamIds.add(m.teamAId);
            teamIds.add(m.teamBId);
        });
        const playersPlaying = await this.prisma.proPlayer.findMany({
            where: {
                id: { in: proPlayerIds },
                game: { in: siblingGames },
                teamId: { in: Array.from(teamIds) },
            },
            select: { id: true },
        });
        const playingPlayerIds = new Set(playersPlaying.map((p) => p.id));
        const missingPlayers = proPlayerIds.filter((id) => !playingPlayerIds.has(id));
        if (missingPlayers.length > 0) {
            throw new BadRequestException(`The following players do not have a match on this day: ${missingPlayers.join(', ')}`);
        }
        const relevantMatchDays = await this.prisma.matchDay.findMany({
            where: {
                game: { in: league.games },
                date: { lt: matchDay.date },
            },
            include: {
                matches: { select: { tournamentName: true } },
            },
            orderBy: { date: 'desc' },
            take: league.cooldownDays * 3,
        });
        const cooldownMatchDayIds = relevantMatchDays
            .filter((md) => {
            return md.matches.some((m) => {
                const isAllSelected = league.tournaments.includes(`ALL:${md.game}`);
                if (isAllSelected)
                    return true;
                return league.tournaments.includes(m.tournamentName ?? '');
            });
        })
            .slice(0, league.cooldownDays)
            .map((md) => md.id);
        if (cooldownMatchDayIds.length > 0) {
            const recentPicks = await this.prisma.rosterPick.findMany({
                where: {
                    proPlayerId: { in: proPlayerIds },
                    roster: {
                        userId,
                        leagueId,
                        matchDayId: { in: cooldownMatchDayIds },
                    },
                },
                include: {
                    proPlayer: { select: { name: true } },
                    roster: {
                        include: { matchDay: { select: { date: true } } },
                    },
                },
            });
            if (recentPicks.length > 0) {
                const cooldownPlayers = recentPicks.map((p) => `${p.proPlayer.name} (picked on ${p.roster.matchDay.date.toISOString().split('T')[0]})`);
                throw new ForbiddenException(`The following players are in cooldown (${league.cooldownDays} match days): ${cooldownPlayers.join(', ')}`);
            }
        }
    }
};
RosterValidationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], RosterValidationService);
export { RosterValidationService };
//# sourceMappingURL=roster-validation.service.js.map