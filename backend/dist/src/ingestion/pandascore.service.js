var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PandaScoreService_1;
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import axios from 'axios';
import { Game } from '@prisma/client';
let PandaScoreService = PandaScoreService_1 = class PandaScoreService {
    prisma;
    logger = new Logger(PandaScoreService_1.name);
    baseUrl = 'https://api.pandascore.co';
    constructor(prisma) {
        this.prisma = prisma;
    }
    getGameSlug(game) {
        const map = {
            [Game.LEAGUE_OF_LEGENDS]: 'lol',
            [Game.COUNTER_STRIKE]: 'csgo',
            [Game.ROCKET_LEAGUE]: 'rl',
            [Game.VALORANT]: 'valorant',
        };
        return map[game];
    }
    async syncUpcomingMatches(game) {
        const token = process.env.PANDASCORE_API_TOKEN;
        if (!token) {
            this.logger.error('PANDASCORE_API_TOKEN is not defined');
            return;
        }
        const gameSlug = this.getGameSlug(game);
        try {
            const minDate = new Date();
            minDate.setDate(minDate.getDate() - 2);
            const minDateStr = minDate.toISOString();
            const maxDate = new Date();
            maxDate.setDate(maxDate.getDate() + 30);
            const maxDateStr = maxDate.toISOString();
            const data = [];
            let page = 1;
            const perPage = 100;
            try {
                while (true) {
                    const res = await axios.get(`${this.baseUrl}/${gameSlug}/matches`, {
                        headers: { Authorization: `Bearer ${token}` },
                        params: {
                            per_page: perPage,
                            page,
                            sort: 'begin_at',
                            'range[begin_at]': `${minDateStr},${maxDateStr}`,
                        },
                    });
                    const pageData = res.data;
                    data.push(...pageData);
                    if (pageData.length < perPage)
                        break;
                    page++;
                }
            }
            catch (e) {
                if (e instanceof Error)
                    this.logger.warn(e.message);
            }
            for (const matchData of data) {
                if (!matchData.opponents || matchData.opponents.length !== 2)
                    continue;
                const teamAData = matchData.opponents[0].opponent;
                const teamBData = matchData.opponents[1].opponent;
                const teamA = await this.upsertTeam(teamAData, game);
                const teamB = await this.upsertTeam(teamBData, game);
                const scheduledAt = new Date(matchData.begin_at);
                const dateStr = scheduledAt.toISOString().split('T')[0];
                const lockTime = new Date(scheduledAt.getTime() - 60 * 60 * 1000);
                let teamAScore = null;
                let teamBScore = null;
                if (matchData.results && matchData.results.length >= 2) {
                    const resA = matchData.results.find((r) => r.team_id === matchData.opponents[0].opponent.id);
                    const resB = matchData.results.find((r) => r.team_id === matchData.opponents[1].opponent.id);
                    if (resA)
                        teamAScore = resA.score;
                    if (resB)
                        teamBScore = resB.score;
                }
                const tournamentName = matchData.league ? matchData.league.name : null;
                const matchDay = await this.prisma.matchDay.upsert({
                    where: { date_game: { date: new Date(dateStr), game } },
                    update: {},
                    create: {
                        date: new Date(dateStr),
                        game,
                        lockTime,
                        status: 'OPEN',
                    },
                });
                await this.prisma.match.upsert({
                    where: { id: matchData.id.toString() },
                    update: {
                        scheduledAt,
                        status: matchData.status,
                        teamAScore,
                        teamBScore,
                        tournamentName,
                        games: matchData.games ?? null,
                        winnerId: matchData.winner_id
                            ? matchData.winner_id.toString()
                            : null,
                    },
                    create: {
                        id: matchData.id.toString(),
                        matchDayId: matchDay.id,
                        teamAId: teamA.id,
                        teamBId: teamB.id,
                        scheduledAt,
                        status: matchData.status,
                        teamAScore,
                        teamBScore,
                        tournamentName,
                        games: matchData.games ?? null,
                        winnerId: matchData.winner_id
                            ? matchData.winner_id.toString()
                            : null,
                    },
                });
            }
            this.logger.log(`Synced ${data.length} upcoming matches for ${game}`);
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Failed to sync PandaScore matches for ${game}: ${error.message}`);
            }
        }
    }
    async hasActiveMatches(game) {
        const now = new Date();
        const count = await this.prisma.match.count({
            where: {
                matchDay: { game },
                OR: [
                    { status: 'running' },
                    { status: 'not_started', scheduledAt: { lte: now } },
                ],
            },
        });
        return count > 0;
    }
    async syncRunningMatches(game) {
        const token = process.env.PANDASCORE_API_TOKEN;
        if (!token)
            return;
        const gameSlug = this.getGameSlug(game);
        try {
            const runningRes = await axios.get(`${this.baseUrl}/${gameSlug}/matches/running`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { per_page: 100 },
            });
            const runningMatches = runningRes.data || [];
            const runningMatchIds = new Set(runningMatches.map((m) => m.id.toString()));
            const now = new Date();
            const dbActiveMatches = await this.prisma.match.findMany({
                where: {
                    matchDay: { game },
                    OR: [
                        { status: 'running' },
                        { status: 'not_started', scheduledAt: { lte: now } },
                    ],
                },
                select: { id: true },
            });
            const missingIds = dbActiveMatches
                .map((m) => m.id)
                .filter((id) => !runningMatchIds.has(id));
            const missingMatches = [];
            if (missingIds.length > 0) {
                for (let i = 0; i < missingIds.length; i += 50) {
                    const chunk = missingIds.slice(i, i + 50);
                    try {
                        const chunkRes = await axios.get(`${this.baseUrl}/${gameSlug}/matches`, {
                            headers: { Authorization: `Bearer ${token}` },
                            params: {
                                'filter[id]': chunk.join(','),
                                per_page: 100,
                            },
                        });
                        if (chunkRes.data) {
                            missingMatches.push(...chunkRes.data);
                        }
                    }
                    catch (e) {
                        if (e instanceof Error) {
                            this.logger.warn(`Failed to fetch missing matches chunk for ${game}: ${e.message}`);
                        }
                    }
                }
            }
            const allMatches = [...runningMatches, ...missingMatches];
            let updatedCount = 0;
            for (const matchData of allMatches) {
                const matchId = matchData.id.toString();
                const dbMatch = await this.prisma.match.findUnique({
                    where: { id: matchId },
                });
                if (!dbMatch)
                    continue;
                let teamAScore = null;
                let teamBScore = null;
                if (matchData.results &&
                    matchData.results.length >= 2 &&
                    matchData.opponents?.length >= 2) {
                    const resA = matchData.results.find((r) => r.team_id === matchData.opponents[0].opponent.id);
                    const resB = matchData.results.find((r) => r.team_id === matchData.opponents[1].opponent.id);
                    if (resA)
                        teamAScore = resA.score;
                    if (resB)
                        teamBScore = resB.score;
                }
                const wasFinished = dbMatch.status === 'finished';
                const isFinished = matchData.status === 'finished';
                await this.prisma.match.update({
                    where: { id: matchId },
                    data: {
                        ...(matchData.begin_at && {
                            scheduledAt: new Date(matchData.begin_at),
                        }),
                        status: matchData.status,
                        teamAScore,
                        teamBScore,
                        games: matchData.games ?? null,
                        winnerId: matchData.winner_id
                            ? matchData.winner_id.toString()
                            : null,
                        ...(matchData.status === 'finished' &&
                            !dbMatch.finishedAt && {
                            finishedAt: matchData.end_at
                                ? new Date(matchData.end_at)
                                : new Date(),
                        }),
                    },
                });
                updatedCount++;
                if (isFinished && !wasFinished) {
                    await this.syncMatchPerformances(matchId, game, dbMatch.matchDayId);
                }
            }
            if (updatedCount > 0) {
                this.logger.log(`Live-updated ${updatedCount} matches for ${game}`);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.warn(`Failed to sync running matches for ${game}: ${error.message}`);
            }
        }
    }
    async syncMatchPerformances(matchId, game, matchDayId) {
        const token = process.env.PANDASCORE_API_TOKEN;
        if (!token)
            return;
        try {
            this.logger.log(`Fetching detailed match data for match ${matchId}...`);
            const res = await axios.get(`${this.baseUrl}/matches/${matchId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const matchData = res.data;
            if (!matchData || !matchData.games || !Array.isArray(matchData.games))
                return;
            const playerStatsAccumulator = new Map();
            for (const gameData of matchData.games) {
                if (!gameData.players || !Array.isArray(gameData.players))
                    continue;
                for (const playerData of gameData.players) {
                    const proPlayerId = playerData.player?.id?.toString();
                    if (!proPlayerId)
                        continue;
                    const exists = await this.prisma.proPlayer.findUnique({
                        where: { id: proPlayerId },
                    });
                    if (!exists)
                        continue;
                    const stats = (playerData.stats || {});
                    const win = playerData.win === true || stats['win'] === true;
                    if (!playerStatsAccumulator.has(proPlayerId)) {
                        playerStatsAccumulator.set(proPlayerId, {
                            kills: 0,
                            deaths: 0,
                            assists: 0,
                            cs: 0,
                            visionScore: 0,
                            firstBlood: false,
                            pentakills: 0,
                            win: false,
                            headshotKills: 0,
                            clutchRounds: 0,
                            mvpStars: 0,
                            bombPlants: 0,
                            bombDefusals: 0,
                            mapWin: false,
                            goals: 0,
                            saves: 0,
                            shots: 0,
                            score: 0,
                            firstBloods: 0,
                            headshots: 0,
                            acs: 0,
                            gamesCount: 0,
                        });
                    }
                    const acc = playerStatsAccumulator.get(proPlayerId);
                    acc.gamesCount += 1;
                    acc.kills += Number(stats['kills'] ?? 0);
                    acc.deaths += Number(stats['deaths'] ?? 0);
                    acc.assists += Number(stats['assists'] ?? 0);
                    acc.cs += Number(stats['cs'] ?? stats['minions_killed'] ?? 0);
                    acc.visionScore += Number(stats['vision_score'] ?? 0);
                    if (stats['first_blood'] === true || stats['first_blood'] === 1)
                        acc.firstBlood = true;
                    acc.pentakills += Number(stats['pentakills'] ?? 0);
                    if (win)
                        acc.win = true;
                    acc.headshotKills += Number(stats['headshot_kills'] ?? stats['headshots'] ?? 0);
                    acc.clutchRounds += Number(stats['clutch_rounds'] ?? 0);
                    acc.mvpStars += Number(stats['mvps'] ?? 0);
                    acc.bombPlants += Number(stats['bomb_plants'] ?? 0);
                    acc.bombDefusals += Number(stats['bomb_defusals'] ?? 0);
                    if (win)
                        acc.mapWin = true;
                    acc.goals += Number(stats['goals'] ?? 0);
                    acc.saves += Number(stats['saves'] ?? 0);
                    acc.shots += Number(stats['shots'] ?? 0);
                    acc.score += Number(stats['score'] ?? 0);
                    acc.firstBloods += Number(stats['first_bloods'] ?? 0);
                    acc.headshots += Number(stats['headshots'] ?? 0);
                    acc.acs += Number(stats['average_combat_score'] ?? stats['acs'] ?? 0);
                }
            }
            for (const [proPlayerId, acc] of playerStatsAccumulator.entries()) {
                if (acc.gamesCount > 0) {
                    acc.acs = Math.round((acc.acs / acc.gamesCount) * 100) / 100;
                }
                await this.prisma.dayPerformance.upsert({
                    where: {
                        matchDayId_proPlayerId: {
                            matchDayId,
                            proPlayerId,
                        },
                    },
                    update: {
                        rawStats: acc,
                    },
                    create: {
                        matchDayId,
                        proPlayerId,
                        rawStats: acc,
                    },
                });
            }
            this.logger.log(`Ingested performances for ${playerStatsAccumulator.size} players in match ${matchId}.`);
        }
        catch (e) {
            if (e instanceof Error) {
                this.logger.error(`Failed to sync match performances for match ${matchId}: ${e.message}`);
            }
        }
    }
    async upsertTeam(teamData, game) {
        const team = await this.prisma.team.upsert({
            where: { id: teamData.id.toString() },
            update: {
                name: teamData.name,
                acronym: teamData.acronym,
                imageUrl: teamData.image_url,
            },
            create: {
                id: teamData.id.toString(),
                name: teamData.name,
                acronym: teamData.acronym,
                imageUrl: teamData.image_url,
                game,
            },
            include: {
                players: true,
            },
        });
        const shouldFetchPlayers = team.players.length === 0 ||
            Date.now() - team.updatedAt.getTime() > 7 * 24 * 60 * 60 * 1000;
        if (shouldFetchPlayers) {
            this.logger.log(`Scheduling players fetch for team ${team.name} (${team.id})...`);
            this.fetchPlayersForTeam(team.id, game).catch((e) => {
                if (e instanceof Error) {
                    this.logger.error(`Failed to fetch players background job for ${team.name}: ${e.message}`);
                }
            });
        }
        return team;
    }
    async fetchPlayersForTeam(teamId, game) {
        const token = process.env.PANDASCORE_API_TOKEN;
        if (!token)
            return;
        try {
            const res = await axios.get(`${this.baseUrl}/teams/${teamId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const responseData = res.data;
            const playersData = responseData.players || [];
            await this.prisma.team.update({
                where: { id: teamId },
                data: { updatedAt: new Date() },
            });
            for (const playerData of playersData) {
                const role = playerData.role || 'Player';
                await this.prisma.proPlayer.upsert({
                    where: { id: playerData.id.toString() },
                    update: {
                        name: playerData.name,
                        role,
                        imageUrl: playerData.image_url,
                        isActive: playerData.active,
                    },
                    create: {
                        id: playerData.id.toString(),
                        teamId,
                        name: playerData.name,
                        game,
                        role,
                        imageUrl: playerData.image_url,
                        isActive: playerData.active,
                    },
                });
            }
            this.logger.log(`Successfully fetched/updated players for team ${teamId}.`);
        }
        catch (e) {
            if (e instanceof Error) {
                this.logger.warn(`Failed to fetch players for team ID ${teamId}: ${e.message}`);
            }
        }
    }
};
PandaScoreService = PandaScoreService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], PandaScoreService);
export { PandaScoreService };
//# sourceMappingURL=pandascore.service.js.map