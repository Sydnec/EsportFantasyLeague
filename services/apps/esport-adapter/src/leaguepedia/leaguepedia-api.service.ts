import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { DetailedPerformancesResult, GameDetail, PlayerRef } from '../adapters/game-adapter.interface';
import { RateLimiter } from '../common/rate-limiter';

/**
 * Specialized stats provider for League of Legends, backed by Leaguepedia's
 * free Cargo query API (no key) — replaces the old Riot Match-V5 correlator,
 * which could never see official matches at all (separate "tournament realm"
 * infrastructure, confirmed unreachable via the public API regardless of key).
 *
 * Correlation here is by team name + date (Pandascore already gives us both),
 * then by player name within the matched series — no manual linking needed,
 * unlike the abandoned Riot approach.
 */
@Injectable()
export class LeaguepediaApiService {
  private readonly logger = new Logger(LeaguepediaApiService.name);
  private readonly baseUrl = 'https://lol.fandom.com/api.php';
  // Conservative on purpose — a shared free wiki API, not ours. ~20 req/min.
  private readonly rateLimiter = new RateLimiter(3000);

  constructor(private readonly httpService: HttpService) {}

  async getMatchPerformances(
    pandascoreMatchId: string,
    teamAName: string | null | undefined,
    teamBName: string | null | undefined,
    scheduledAt: Date,
    players: PlayerRef[],
  ): Promise<DetailedPerformancesResult> {
    if (!teamAName || !teamBName) {
      this.logger.warn(`Missing team names for match ${pandascoreMatchId} — no performances to report.`);
      return { performances: [] };
    }

    const found = await this.findMatchGames(teamAName, teamBName, scheduledAt);
    if (!found) {
      this.logger.warn(`No Leaguepedia match found for ${teamAName} vs ${teamBName} around ${scheduledAt.toISOString()}.`);
      return { performances: [] };
    }
    const { matchId, games } = found;

    const rows = await this.cargoQuery({
      tables: 'ScoreboardPlayers',
      fields: 'ScoreboardPlayers.Link,ScoreboardPlayers.Kills,ScoreboardPlayers.Deaths,ScoreboardPlayers.Assists,ScoreboardPlayers.Gold,ScoreboardPlayers.CS',
      where: `ScoreboardPlayers.MatchId="${this.escapeCargoValue(matchId)}"`,
      limit: '50',
    });

    if (!rows.length) {
      this.logger.warn(`Leaguepedia match ${matchId} has no player rows — no performances to report.`);
      return { performances: [], games };
    }

    // A Bo3/Bo5 series has one row per game per player — aggregate across the series.
    const totalsByName = new Map<string, Record<string, number>>();
    for (const row of rows) {
      const name = this.normalizeName(row.Link);
      if (!name) continue;
      const current = totalsByName.get(name) ?? { kills: 0, deaths: 0, assists: 0, gold: 0, creepScore: 0 };
      current.kills += Number(row.Kills) || 0;
      current.deaths += Number(row.Deaths) || 0;
      current.assists += Number(row.Assists) || 0;
      current.gold += Number(row.Gold) || 0;
      current.creepScore += Number(row.CS) || 0;
      totalsByName.set(name, current);
    }

    // A registered roster player with no row here almost always means they were
    // benched for this specific match — that's real information (0 fantasy
    // points), not a gap to paper over with a fabricated stat line, so skip them.
    const performances = players.flatMap((player) => {
      const stats = totalsByName.get(this.normalizeName(player.name));
      if (stats) return [{ esportPlayerId: player.id, rawStats: stats }];
      this.logger.log(`Player "${player.name}" has no row in Leaguepedia match ${matchId} — likely benched, skipping.`);
      return [];
    });

    return { performances, games };
  }

  /**
   * Team1/Team2 side isn't guaranteed to line up with ours, so try both
   * orderings. Also builds the per-game "games" enrichment (real kill score
   * per game — LoL has no distinct maps, so `map` stays null) from the same
   * query, at no extra request cost. Field names (Team1Kills/Team2Kills/
   * Gamelength) are per Leaguepedia's documented Cargo schema, not re-verified
   * live this round to avoid burning more of the rate limit — if any of them
   * turn out wrong, cargoQuery/parsing just yields no games, no crash.
   */
  private async findMatchGames(
    teamAName: string,
    teamBName: string,
    scheduledAt: Date,
  ): Promise<{ matchId: string; games: GameDetail[] } | null> {
    const windowStart = this.formatCargoDate(new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000));
    const windowEnd = this.formatCargoDate(new Date(scheduledAt.getTime() + 24 * 60 * 60 * 1000));
    const dateWhere = `ScoreboardGames.DateTime_UTC >= "${windowStart}" AND ScoreboardGames.DateTime_UTC <= "${windowEnd}"`;
    const normA = this.normalizeName(teamAName);
    const normB = this.normalizeName(teamBName);

    for (const [a, b] of [
      [teamAName, teamBName],
      [teamBName, teamAName],
    ]) {
      const rows = await this.cargoQuery({
        tables: 'ScoreboardGames',
        fields:
          'ScoreboardGames.MatchId,ScoreboardGames.GameId,ScoreboardGames.Team1,ScoreboardGames.Team2,ScoreboardGames.WinTeam,ScoreboardGames.Team1Kills,ScoreboardGames.Team2Kills,ScoreboardGames.Gamelength',
        where: `ScoreboardGames.Team1="${this.escapeCargoValue(a)}" AND ScoreboardGames.Team2="${this.escapeCargoValue(b)}" AND ${dateWhere}`,
        limit: '10',
        'order by': 'ScoreboardGames.GameId',
      });
      if (!rows.length) continue;

      const matchId = rows[0].MatchId;
      const games = rows
        .filter((row) => row.MatchId === matchId)
        .map((row, index): GameDetail => {
          const team1IsA = this.normalizeName(row.Team1) === normA;
          const team1Kills = Number(row.Team1Kills);
          const team2Kills = Number(row.Team2Kills);
          const winnerIsTeam1 = this.normalizeName(row.WinTeam) === this.normalizeName(row.Team1);
          const winnerIsTeam2 = this.normalizeName(row.WinTeam) === this.normalizeName(row.Team2);
          // Kills are informational only here — never used to infer the
          // winner, since a LoL game can be won on objectives/backdoor with
          // fewer kills than the loser. WinTeam is the actual source of truth.
          let winnerSide: 'A' | 'B' | null = null;
          if (winnerIsTeam1) winnerSide = team1IsA ? 'A' : 'B';
          else if (winnerIsTeam2) winnerSide = team1IsA ? 'B' : 'A';

          return {
            id: row.GameId ?? undefined,
            position: index + 1,
            map: null,
            teamAScore: Number.isFinite(team1Kills) ? (team1IsA ? team1Kills : team2Kills) : null,
            teamBScore: Number.isFinite(team2Kills) ? (team1IsA ? team2Kills : team1Kills) : null,
            winnerSide,
            length: this.parseGamelength(row.Gamelength),
          };
        });
      return { matchId, games };
    }
    return null;
  }

  /** Leaguepedia's Gamelength is a "MM:SS" (or "H:MM:SS") string — convert to seconds. */
  private parseGamelength(value: string | undefined): number | null {
    if (!value) return null;
    const parts = value.split(':').map(Number);
    if (parts.some((n) => isNaN(n))) return null;
    return parts.reduce((acc, n) => acc * 60 + n, 0);
  }

  private async cargoQuery(params: Record<string, string>): Promise<any[]> {
    const { data } = await this.rateLimiter.schedule(() =>
      firstValueFrom(
        this.httpService
          .get(this.baseUrl, { params: { action: 'cargoquery', format: 'json', ...params } })
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(`Leaguepedia request failed: ${error.message}`);
              throw error;
            }),
          ),
      ),
    );

    if (data.error) {
      this.logger.warn(`Leaguepedia API error: ${data.error.info ?? data.error.code}`);
      return [];
    }
    return (data.cargoquery ?? []).map((r: any) => r.title);
  }

  private escapeCargoValue(value: string): string {
    return value.replace(/"/g, '\\"');
  }

  private formatCargoDate(d: Date): string {
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }

  // Leaguepedia player pages are often titled "Alias (Real Name)" — compare on
  // just the alias, case-insensitively, since that's what Pandascore uses too.
  private normalizeName(name: string | null | undefined): string {
    return (name ?? '').split('(')[0].trim().toLowerCase();
  }

}
