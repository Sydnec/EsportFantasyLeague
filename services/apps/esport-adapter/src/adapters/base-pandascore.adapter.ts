import { Game } from '@prisma/client-esport';
import {
  DetailedPerformancesResult,
  GameAdapter,
  MatchUpsertInput,
  PlayerPerformance,
  PlayerRef,
  PlayerUpsertInput,
  StoredMatchRef,
  TeamUpsertInput,
} from './game-adapter.interface';

/**
 * Pandascore's team/player/match payload shape is identical across games, so
 * the mapping logic lives here once. Only fetchDetailedPerformances (the
 * per-game "specialized API" call) differs between concrete adapters.
 */
export abstract class BasePandascoreAdapter implements GameAdapter {
  abstract readonly game: Game;
  abstract readonly pandascoreSlug: string;
  abstract fetchDetailedPerformances(match: StoredMatchRef, players: PlayerRef[]): Promise<DetailedPerformancesResult>;

  /**
   * Competitive tiers to keep, most-to-least prestigious ('s' > 'a' > 'b' > 'c' > 'd').
   * `null` (the default) means no filtering — override per game to restrict.
   */
  protected readonly allowedTiers: string[] | null = null;

  isTournamentAllowed(raw: any): boolean {
    if (!this.allowedTiers) return true;
    const tier = raw.tournament?.tier;
    // Fail open on missing tier data rather than silently dropping matches.
    if (!tier) return true;
    return this.allowedTiers.includes(tier);
  }

  mapTeam(raw: any): TeamUpsertInput {
    return {
      id: raw.id.toString(),
      name: raw.name,
      acronym: raw.acronym ?? null,
      imageUrl: raw.image_url ?? null,
      location: raw.location || null,
    };
  }

  mapPlayer(raw: any): PlayerUpsertInput {
    return {
      id: raw.id.toString(),
      name: raw.name,
      // Pandascore genuinely doesn't track an in-game role/position for most
      // players outside LoL (CS/Rocket League players come back with role: null).
      // Empty string (not a placeholder word) so the frontend can just omit the
      // role badge entirely instead of showing a "no role" pill.
      role: raw.role ?? '',
      imageUrl: raw.image_url ?? null,
      isActive: raw.active ?? true,
      nationality: raw.nationality || null,
      esportTeamId: raw.current_team?.id != null ? raw.current_team.id.toString() : null,
    };
  }

  mapMatch(raw: any): MatchUpsertInput {
    const opponents = (raw.opponents ?? []).map((o: any) => o.opponent).filter(Boolean);
    const [teamA, teamB] = opponents;
    const results: Array<{ team_id: number | string; score: number }> = raw.results ?? [];
    const scoreFor = (teamId?: string | number) =>
      results.find((r) => r.team_id?.toString() === teamId?.toString())?.score ?? null;

    // Prefer the official stream, then whichever is flagged "main", else just the first one listed.
    const streams: Array<{ official?: boolean; main?: boolean; raw_url?: string }> = raw.streams_list ?? [];
    const bestStream = streams.find((s) => s.official) ?? streams.find((s) => s.main) ?? streams[0];

    return {
      id: raw.id.toString(),
      name: raw.name,
      status: raw.status,
      scheduledAt: new Date(raw.scheduled_at ?? raw.begin_at ?? Date.now()),
      beginAt: raw.begin_at ? new Date(raw.begin_at) : null,
      endAt: raw.end_at ? new Date(raw.end_at) : null,
      teamAId: teamA?.id != null ? teamA.id.toString() : null,
      teamBId: teamB?.id != null ? teamB.id.toString() : null,
      winnerId: raw.winner_id != null ? raw.winner_id.toString() : (raw.winner?.id != null ? raw.winner.id.toString() : null),
      teamAScore: teamA ? scoreFor(teamA.id) : null,
      teamBScore: teamB ? scoreFor(teamB.id) : null,
      // Full 3-level detail: "League / Serie / Tournament stage" (e.g. "LEC / Summer
      // 2026 / Regular Season"). Filter/group-by call sites take `.split(' / ')[0]`
      // to get just the league; the match detail page uses the whole string.
      tournamentName: [raw.league?.name, raw.serie?.full_name, raw.tournament?.name].filter(Boolean).join(' / ') || null,
      streamUrl: bestStream?.raw_url ?? null,
      matchType: raw.match_type ?? null,
      numberOfGames: raw.number_of_games ?? null,
      games: raw.games ?? null,
    };
  }

  /**
   * Best-effort extraction of per-player stats out of Pandascore's own `games`
   * sub-array (map/round breakdown), for games without a dedicated specialized
   * API yet. Returns [] when Pandascore didn't include player-level stats.
   */
  protected extractStatsFromGames(games: any[] | null | undefined, players: PlayerRef[]): PlayerPerformance[] {
    if (!games?.length) return [];

    const playerIds = players.map((p) => p.id);
    const totals = new Map<string, Record<string, number>>();
    for (const g of games) {
      const gamePlayers = g.players ?? g.player_stats ?? [];
      for (const p of gamePlayers) {
        const playerId = p.player?.id != null ? p.player.id.toString() : p.player_id?.toString();
        if (!playerId || !playerIds.includes(playerId)) continue;

        const stats = p.stats ?? p;
        const current = totals.get(playerId) ?? {};
        for (const [key, value] of Object.entries(stats)) {
          if (typeof value === 'number') {
            current[key] = (current[key] ?? 0) + value;
          }
        }
        totals.set(playerId, current);
      }
    }

    return Array.from(totals.entries()).map(([esportPlayerId, rawStats]) => ({ esportPlayerId, rawStats }));
  }
}
