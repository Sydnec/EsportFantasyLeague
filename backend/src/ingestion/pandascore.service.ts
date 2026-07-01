import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import axios from 'axios';
import { Game } from '@prisma/client';

export interface PandaScorePlayer {
  id: number;
  name: string;
  role: string | null;
  image_url: string | null;
  active: boolean;
}

export interface PandaScoreTeam {
  id: number;
  name: string;
  acronym: string | null;
  image_url: string | null;
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
  games: number;
  winner_id: number | null;
  league: { name: string } | null;
  opponents: Array<{ opponent: PandaScoreTeam }>;
  results: PandaScoreResult[];
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

        const tournamentName = matchData.league ? matchData.league.name : null;

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

        // Upsert Match
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
      const runningMatchIds = new Set(runningMatches.map((m) => m.id.toString()));

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
              this.logger.warn(`Failed to fetch missing matches chunk for ${game}: ${e.message}`);
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

        await this.prisma.match.update({
          where: { id: matchId },
          data: {
            ...(matchData.begin_at && { scheduledAt: new Date(matchData.begin_at) }),
            status: matchData.status,
            teamAScore,
            teamBScore,
            games: matchData.games ?? null,
            winnerId: matchData.winner_id
              ? matchData.winner_id.toString()
              : null,
            ...(matchData.status === 'finished' && !dbMatch.finishedAt && {
              finishedAt: matchData.end_at ? new Date(matchData.end_at) : new Date(),
            }),
          },
        });
        updatedCount++;
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

  private async upsertTeam(teamData: PandaScoreTeam, game: Game) {
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

    if (team.players.length === 0) {
      this.logger.log(`Fetching players for team ${team.name} (${team.id})...`);
      const token = process.env.PANDASCORE_API_TOKEN;
      try {
        const res = await axios.get(`${this.baseUrl}/teams/${team.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const responseData = res.data as { players?: PandaScorePlayer[] };
        const playersData: PandaScorePlayer[] = responseData.players || [];
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
              teamId: team.id,
              name: playerData.name,
              game,
              role,
              imageUrl: playerData.image_url,
              isActive: playerData.active,
            },
          });
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          this.logger.warn(
            `Failed to fetch players for team ${team.name}: ${e.message}`,
          );
        }
      }
    }

    return team;
  }
}
