import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { PlayerPerformance, PlayerRef } from '../adapters/game-adapter.interface';
import { RateLimiter } from '../common/rate-limiter';

/**
 * Specialized stats provider for Rocket League, backed by octane.gg's free
 * public API (`zsr.octane.gg`) — real RLCS match/player data, no key needed.
 *
 * NOTE: octane.gg's endpoint wasn't reachable from this dev sandbox to verify
 * the exact response shape live (TLS-level rejection, likely bot filtering
 * that a normal browser/axios client won't trigger). The endpoint paths and
 * field names below follow the documented REST conventions (`/matches`
 * filtered by date, `goals`/`assists`/`saves`/`shots`/`score` as the standard
 * RL box-score vocabulary) but should be treated as best-effort until
 * confirmed against a real response — hence the defensive multi-shape parsing
 * and the catch-all fallback to mocked stats on any parsing surprise, not
 * just network failures.
 */
@Injectable()
export class OctaneApiService {
  private readonly logger = new Logger(OctaneApiService.name);
  private readonly baseUrl = 'https://zsr.octane.gg';
  // Conservative on purpose — a free public API, not ours. ~20 req/min.
  private readonly rateLimiter = new RateLimiter(3000);

  constructor(private readonly httpService: HttpService) {}

  async getMatchPerformances(
    pandascoreMatchId: string,
    teamAName: string | null | undefined,
    teamBName: string | null | undefined,
    scheduledAt: Date,
    players: PlayerRef[],
  ): Promise<PlayerPerformance[]> {
    if (!teamAName || !teamBName) {
      this.logger.warn(`Missing team names for match ${pandascoreMatchId} — no performances to report.`);
      return [];
    }

    try {
      const match = await this.findMatch(teamAName, teamBName, scheduledAt);
      if (!match) {
        this.logger.warn(`No octane.gg match found for ${teamAName} vs ${teamBName} around ${scheduledAt.toISOString()}.`);
        return [];
      }

      const statsByName = this.extractPlayerStats(match);
      if (!statsByName.size) {
        this.logger.warn(`octane.gg match found but no player stats extracted — no performances to report.`);
        return [];
      }

      // A registered roster player missing from a match we DID find almost
      // always means they were benched — real info (0 points), not a gap to
      // paper over with a fabricated line, so skip them.
      return players.flatMap((player) => {
        const stats = statsByName.get(this.normalizeName(player.name));
        if (stats) return [{ esportPlayerId: player.id, rawStats: stats }];
        this.logger.log(`Player "${player.name}" has no row in this octane.gg match — likely benched, skipping.`);
        return [];
      });
    } catch (error: any) {
      // Covers both network failures and unexpected response shapes — a wrong
      // guess about octane.gg's exact JSON structure degrades to no performances
      // instead of breaking the whole stats-ingestion cron.
      this.logger.error(`octane.gg lookup failed for match ${pandascoreMatchId}: ${error.message}`);
      return [];
    }
  }

  private async findMatch(teamAName: string, teamBName: string, scheduledAt: Date): Promise<any | null> {
    const after = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const before = new Date(scheduledAt.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const data = await this.get('/matches', { after, before, perPage: 50 });
    const candidates: any[] = Array.isArray(data) ? data : (data?.matches ?? []);

    const normA = this.normalizeName(teamAName);
    const normB = this.normalizeName(teamBName);

    return (
      candidates.find((match) => {
        const teamNames = this.extractTeamNames(match).map((n) => this.normalizeName(n));
        return teamNames.includes(normA) && teamNames.includes(normB);
      }) ?? null
    );
  }

  /** octane.gg has historically used a blue/orange side structure for RL matches. */
  private extractTeamNames(match: any): string[] {
    const teams = match.blue && match.orange ? [match.blue, match.orange] : (match.teams ?? []);
    return teams.map((t: any) => t?.team?.name ?? t?.name).filter(Boolean);
  }

  private extractPlayerStats(match: any): Map<string, Record<string, number>> {
    const totals = new Map<string, Record<string, number>>();
    const games: any[] = match.games ?? [match];

    for (const game of games) {
      const sides = game.blue && game.orange ? [game.blue, game.orange] : (game.teams ?? []);
      for (const side of sides) {
        const rows = side.players ?? [];
        for (const row of rows) {
          const name = this.normalizeName(row.player?.tag ?? row.player?.name ?? row.name);
          if (!name) continue;
          const stats = row.stats?.core ?? row.stats ?? row;
          const current = totals.get(name) ?? { score: 0, goals: 0, assists: 0, saves: 0, shots: 0 };
          current.score += Number(stats.score) || 0;
          current.goals += Number(stats.goals) || 0;
          current.assists += Number(stats.assists) || 0;
          current.saves += Number(stats.saves) || 0;
          current.shots += Number(stats.shots) || 0;
          totals.set(name, current);
        }
      }
    }
    return totals;
  }

  private async get(path: string, params: Record<string, any>): Promise<any> {
    const { data } = await this.rateLimiter.schedule(() =>
      firstValueFrom(
        this.httpService.get(`${this.baseUrl}${path}`, { params }).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`octane.gg request failed (${path}): ${error.message}`);
            throw error;
          }),
        ),
      ),
    );
    return data;
  }

  private normalizeName(name: string | null | undefined): string {
    return (name ?? '').trim().toLowerCase();
  }

}
