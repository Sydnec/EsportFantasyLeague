import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import axios from 'axios';
import { Game } from '@prisma/client';

export interface PandaScorePlayer {
  id: number;
  name: string;
  role: string | null;
  image_url: string | null;
  nationality?: string | null;
  active: boolean;
}

export interface PandaScoreTeam {
  id: number;
  name: string;
  acronym: string | null;
  image_url: string | null;
  location?: string | null;
  players?: PandaScorePlayer[];
}

export interface PandaScoreResult {
  team_id: number;
  score: number;
}

export interface PandaScoreMatch {
  id: number;
  begin_at: string;
  end_at?: string | null;
  status: string;
  match_type: string | null;
  number_of_games: number | null;
  map_picks: any | null;
  games: any;
  winner_id: number | null;
  league: { name: string } | null;
  serie?: { name?: string; full_name?: string } | null;
  tournament?: { id: number; name: string; tier?: string } | null;
  streams_list?: Array<{ main: boolean; raw_url: string; language: string }> | null;
  opponents: Array<{ opponent: PandaScoreTeam }>;
  results: PandaScoreResult[];
}

export interface PandaScoreGamePlayer {
  player?: { id?: number };
  stats?: Record<string, any>;
  win?: boolean;
  champion?: { name: string; image_url: string };
  agent?: { name: string; image_url: string };
}

export interface PandaScoreGameDetail {
  players?: PandaScoreGamePlayer[];
}

export interface PandaScoreMatchDetail {
  games?: PandaScoreGameDetail[];
}

@Injectable()
export class PandaScoreService {
  private readonly logger = new Logger(PandaScoreService.name);
  private readonly baseUrl = 'https://api.pandascore.co';

  constructor(private prisma: PrismaService) {}

  private getGameSlug(game: Game): string {
    const map: Record<Game, string> = {
      [Game.LEAGUE_OF_LEGENDS]: 'lol',
      [Game.COUNTER_STRIKE]: 'csgo',
      [Game.ROCKET_LEAGUE]: 'rl',
      [Game.VALORANT]: 'valorant',
    };
    return map[game];
  }

  async syncUpcomingMatches(game: Game) {
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

      const data: PandaScoreMatch[] = [];
      let page = 1;
      const perPage = 100; // PandaScore max per_page
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
          const pageData = res.data as PandaScoreMatch[];
          data.push(...pageData);

          // If we got fewer results than per_page, we've reached the last page
          if (pageData.length < perPage) break;
          page++;
        }
      } catch (e: unknown) {
        if (e instanceof Error) this.logger.warn(e.message);
      }

      for (const matchData of data) {
        if (!matchData.opponents || matchData.opponents.length !== 2) continue;

        const tier = matchData.tournament?.tier?.toLowerCase();
        if (tier !== 's' && tier !== 'a' && tier !== 'b' && tier !== 'c') continue;

        const teamAData = matchData.opponents[0].opponent;
        const teamBData = matchData.opponents[1].opponent;

        const tournamentId = matchData.tournament?.id?.toString() || null;
        const teamA = await this.upsertTeam(teamAData, game, tournamentId);
        const teamB = await this.upsertTeam(teamBData, game, tournamentId);

        const scheduledAt = new Date(matchData.begin_at);
        const dateStr = scheduledAt.toISOString().split('T')[0];
        const lockTime = new Date(scheduledAt.getTime() - 60 * 60 * 1000);
        let teamAScore = null;
        let teamBScore = null;
        if (matchData.results && matchData.results.length >= 2) {
          const resA = matchData.results.find(
            (r: PandaScoreResult) =>
              r.team_id === matchData.opponents[0].opponent.id,
          );
          const resB = matchData.results.find(
            (r: PandaScoreResult) =>
              r.team_id === matchData.opponents[1].opponent.id,
          );
          if (resA) teamAScore = resA.score;
          if (resB) teamBScore = resB.score;
        } // Lock 1h before first match

        // Upsert MatchDay
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

        const existingMatch = await this.prisma.match.findUnique({
          where: { id: matchData.id.toString() },
          select: { status: true },
        });
        const wasFinished = existingMatch?.status === 'finished';

        // Upsert Match
        const dbMatch = await this.prisma.match.upsert({
          where: { id: matchData.id.toString() },
          update: {
            scheduledAt,
            status: matchData.status,
            teamAScore,
            teamBScore,
            tournamentName: `${matchData.league?.name || 'League'} / ${matchData.tournament?.name || 'Tournament'}`,
            streamUrl: matchData.streams_list?.find((s: any) => s.main)?.raw_url || null,
            matchType: matchData.match_type,
            numberOfGames: matchData.number_of_games,
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
            tournamentName: `${matchData.league?.name || 'League'} / ${matchData.tournament?.name || 'Tournament'}`,
            streamUrl: matchData.streams_list?.find((s: any) => s.main)?.raw_url || null,
            matchType: matchData.match_type,
            numberOfGames: matchData.number_of_games,
            games: matchData.games ?? null,
            winnerId: matchData.winner_id
              ? matchData.winner_id.toString()
              : null,
          },
        });

        if (matchData.status === 'finished' && !wasFinished) {
          await this.syncMatchPerformances(dbMatch.id, game, matchDay.id);
        }
      }

      this.logger.log(`Synced ${data.length} upcoming matches for ${game}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to sync PandaScore matches for ${game}: ${error.message}`,
        );
      }
    }
  }
  /**
   * Checks if there are any active matches or matches that should have started by now
   * to avoid unnecessary API calls.
   */
  async hasActiveMatches(game: Game): Promise<boolean> {
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

  async syncRunningMatches(game: Game) {
    const token = process.env.PANDASCORE_API_TOKEN;
    if (!token) return;

    const gameSlug = this.getGameSlug(game);

    try {
      // 1. Fetch running matches globally
      const runningRes = await axios.get(
        `${this.baseUrl}/${gameSlug}/matches/running`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { per_page: 100 },
        },
      );
      const runningMatches = (runningRes.data as PandaScoreMatch[]) || [];
      const runningMatchIds = new Set(
        runningMatches.map((m) => m.id.toString()),
      );

      // 2. Find matches in DB that we expect to be running or recently started
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

      const missingMatches: PandaScoreMatch[] = [];
      if (missingIds.length > 0) {
        // Fetch missing matches by id in chunks
        for (let i = 0; i < missingIds.length; i += 50) {
          const chunk = missingIds.slice(i, i + 50);
          try {
            const chunkRes = await axios.get(
              `${this.baseUrl}/${gameSlug}/matches`,
              {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                  'filter[id]': chunk.join(','),
                  per_page: 100,
                },
              },
            );
            if (chunkRes.data) {
              missingMatches.push(...(chunkRes.data as PandaScoreMatch[]));
            }
          } catch (e: unknown) {
            if (e instanceof Error) {
              this.logger.warn(
                `Failed to fetch missing matches chunk for ${game}: ${e.message}`,
              );
            }
          }
        }
      }

      const allMatches = [...runningMatches, ...missingMatches];
      let updatedCount = 0;

      for (const matchData of allMatches) {
        const matchId = matchData.id.toString();

        // Check if this match exists in our DB
        const dbMatch = await this.prisma.match.findUnique({
          where: { id: matchId },
        });

        if (!dbMatch) continue; // Skip matches we don't track

        let teamAScore = null;
        let teamBScore = null;
        if (
          matchData.results &&
          matchData.results.length >= 2 &&
          matchData.opponents?.length >= 2
        ) {
          const resA = matchData.results.find(
            (r: PandaScoreResult) =>
              r.team_id === matchData.opponents[0].opponent.id,
          );
          const resB = matchData.results.find(
            (r: PandaScoreResult) =>
              r.team_id === matchData.opponents[1].opponent.id,
          );
          if (resA) teamAScore = resA.score;
          if (resB) teamBScore = resB.score;
        }

        const wasFinished = dbMatch.status === 'finished';
        const isFinished = matchData.status === 'finished';

        const mainStream = matchData.streams_list?.find((s: any) => s.main) || matchData.streams_list?.[0];
        const streamUrl = mainStream ? mainStream.raw_url : null;

        await this.prisma.match.update({
          where: { id: matchId },
          data: {
            ...(matchData.begin_at && {
              scheduledAt: new Date(matchData.begin_at),
            }),
            status: matchData.status,
            teamAScore,
            teamBScore,
            streamUrl,
            matchType: matchData.match_type,
            numberOfGames: matchData.number_of_games,
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.warn(
          `Failed to sync running matches for ${game}: ${error.message}`,
        );
      }
    }
  }

  async syncMatchPerformances(matchId: string, game: Game, matchDayId: string) {
    const token = process.env.PANDASCORE_API_TOKEN;
    if (!token) return;

    try {
      this.logger.log(`Fetching detailed match data for match ${matchId}...`);
      const res = await axios.get(`${this.baseUrl}/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const matchData = res.data as PandaScoreMatchDetail;
      if (!matchData || !matchData.games || !Array.isArray(matchData.games))
        return;

      const playerStatsAccumulator = new Map<string, Record<string, any>>();

      for (const gameData of matchData.games) {
        if (!gameData.players || !Array.isArray(gameData.players)) continue;

        for (const playerData of gameData.players) {
          const proPlayerId = playerData.player?.id?.toString();
          if (!proPlayerId) continue;

          const exists = await this.prisma.proPlayer.findUnique({
            where: { id: proPlayerId },
          });
          if (!exists || !exists.isActive) continue;

          const stats = (playerData.stats || {}) as Record<string, unknown>;
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
              // CS-specific
              headshotKills: 0,
              clutchRounds: 0,
              mvpStars: 0,
              bombPlants: 0,
              bombDefusals: 0,
              mapWin: false,
              // Rocket League
              goals: 0,
              saves: 0,
              shots: 0,
              score: 0,
              // Valorant
              firstBloods: 0,
              headshots: 0,
              // Advanced stats LoL
              damageDealt: 0,
              wardsPlaced: 0,
              // Advanced stats CS/Valorant
              kast: 0,
              // Games list for detailed view
              games: [],
              gamesCount: 0,
            });
          }

          const acc = playerStatsAccumulator.get(proPlayerId)!;
          acc.gamesCount += 1;
          
          const gameDetail = {
            champion: playerData.champion ?? playerData.agent ?? null,
            kills: Number(stats['kills'] ?? 0),
            deaths: Number(stats['deaths'] ?? 0),
            assists: Number(stats['assists'] ?? 0),
          };
          acc.games.push(gameDetail);

          // LoL
          acc.kills += Number(stats['kills'] ?? 0);
          acc.deaths += Number(stats['deaths'] ?? 0);
          acc.assists += Number(stats['assists'] ?? 0);
          acc.cs += Number(stats['cs'] ?? stats['minions_killed'] ?? 0);
          acc.visionScore += Number(stats['vision_score'] ?? 0);
          acc.damageDealt += Number(stats['damage_dealt_to_champions'] ?? stats['damage_dealt'] ?? 0);
          acc.wardsPlaced += Number(stats['wards_placed'] ?? 0);
          if (stats['first_blood'] === true || stats['first_blood'] === 1)
            acc.firstBlood = true;
          acc.pentakills += Number(stats['pentakills'] ?? 0);
          if (win) acc.win = true;

          // CS
          acc.headshotKills += Number(
            stats['headshot_kills'] ?? stats['headshots'] ?? 0,
          );
          acc.clutchRounds += Number(stats['clutch_rounds'] ?? 0);
          acc.mvpStars += Number(stats['mvps'] ?? 0);
          acc.bombPlants += Number(stats['bomb_plants'] ?? 0);
          acc.bombDefusals += Number(stats['bomb_defusals'] ?? 0);
          acc.kast += Number(stats['kast'] ?? 0);
          if (win) acc.mapWin = true;

          // Rocket League
          acc.goals += Number(stats['goals'] ?? 0);
          acc.saves += Number(stats['saves'] ?? 0);
          acc.shots += Number(stats['shots'] ?? 0);
          acc.score += Number(stats['score'] ?? 0);

          // Valorant
          acc.firstBloods += Number(stats['first_bloods'] ?? 0);
          acc.headshots += Number(stats['headshots'] ?? 0);
          acc.acs += Number(stats['average_combat_score'] ?? stats['acs'] ?? 0);
          acc.kast += Number(stats['kast'] ?? 0);
        }
      }

      for (const [proPlayerId, acc] of playerStatsAccumulator.entries()) {
        if (acc.gamesCount > 0) {
          acc.acs = Math.round((acc.acs / acc.gamesCount) * 100) / 100;
          acc.kast = Math.round((acc.kast / acc.gamesCount) * 100) / 100;
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
      this.logger.log(
        `Ingested performances for ${playerStatsAccumulator.size} players in match ${matchId}.`,
      );
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.logger.error(
          `Failed to sync match performances for match ${matchId}: ${e.message}`,
        );
      }
    }
  }

  private async upsertTeam(teamData: PandaScoreTeam, game: Game, tournamentId?: string | null) {
    const team = await this.prisma.team.upsert({
      where: { id: teamData.id.toString() },
      update: {
        name: teamData.name,
        acronym: teamData.acronym,
        imageUrl: teamData.image_url,
        location: teamData.location,
      },
      create: {
        id: teamData.id.toString(),
        name: teamData.name,
        acronym: teamData.acronym,
        imageUrl: teamData.image_url,
        location: teamData.location,
        game,
      },
      include: {
        players: true,
      },
    });

    const shouldFetchPlayers =
      team.players.length === 0 ||
      Date.now() - team.updatedAt.getTime() > 7 * 24 * 60 * 60 * 1000;

    if (shouldFetchPlayers) {
      this.logger.log(
        `Scheduling players fetch for team ${team.name} (${team.id})...`,
      );
      
      const fetchPromise = tournamentId 
        ? this.fetchPlayersForTournament(team.id, tournamentId, game)
        : this.fetchPlayersForTeam(team.id, game);

      fetchPromise.catch((e: unknown) => {
        if (e instanceof Error) {
          this.logger.error(
            `Failed to fetch players background job for ${team.name}: ${e.message}`,
          );
        }
      });
    }

    return team;
  }

  private async fetchPlayersForTournament(teamId: string, tournamentId: string, game: Game) {
    const token = process.env.PANDASCORE_API_TOKEN;
    if (!token) return;
    try {
      const res = await axios.get(`${this.baseUrl}/tournaments/${tournamentId}/rosters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const rostersData = res.data?.rosters || [];
      const teamRoster = rostersData.find((r: any) => r.id.toString() === teamId);
      
      if (!teamRoster || !teamRoster.players) {
        // Fallback to team endpoint if roster not found
        return this.fetchPlayersForTeam(teamId, game);
      }

      const playersData: PandaScorePlayer[] = teamRoster.players;

      // Force update team updatedAt field
      await this.prisma.team.update({
        where: { id: teamId },
        data: { updatedAt: new Date() },
      });

      // Fetch existing players for this team to mark inactive ones
      const existingPlayers = await this.prisma.proPlayer.findMany({
        where: { teamId },
      });
      const activePlayerIds = new Set(playersData.map(p => p.id.toString()));

      for (const ep of existingPlayers) {
        if (!activePlayerIds.has(ep.id)) {
          await this.prisma.proPlayer.update({
            where: { id: ep.id },
            data: { isActive: false },
          });
        }
      }

      for (const playerData of playersData) {
        const role = playerData.role || 'Player';
        await this.prisma.proPlayer.upsert({
          where: { id: playerData.id.toString() },
          update: {
            name: playerData.name,
            role,
            imageUrl: playerData.image_url,
            nationality: playerData.nationality,
            isActive: true,
            teamId,
          },
          create: {
            id: playerData.id.toString(),
            name: playerData.name,
            role,
            imageUrl: playerData.image_url,
            nationality: playerData.nationality,
            isActive: true,
            teamId,
            game,
          },
        });
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.logger.error(`Failed to fetch tournament roster: ${e.message}`);
        // Fallback
        return this.fetchPlayersForTeam(teamId, game);
      }
    }
  }

  private async fetchPlayersForTeam(teamId: string, game: Game) {
    const token = process.env.PANDASCORE_API_TOKEN;
    if (!token) return;
    try {
      const res = await axios.get(`${this.baseUrl}/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const responseData = res.data as {
        name?: string;
        players?: PandaScorePlayer[];
      };
      const playersData: PandaScorePlayer[] = responseData.players || [];

      // Force update team updatedAt field
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
            nationality: playerData.nationality,
            isActive: playerData.active,
          },
          create: {
            id: playerData.id.toString(),
            teamId,
            name: playerData.name,
            game,
            role,
            imageUrl: playerData.image_url,
            nationality: playerData.nationality,
            isActive: playerData.active,
          },
        });
      }
      this.logger.log(
        `Successfully fetched/updated players for team ${teamId}.`,
      );
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.logger.warn(
          `Failed to fetch players for team ID ${teamId}: ${e.message}`,
        );
      }
    }
  }
}
