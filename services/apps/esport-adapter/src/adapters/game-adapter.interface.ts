import { Game } from '@prisma/client-esport';

export interface TeamUpsertInput {
  id: string;
  name: string;
  acronym?: string | null;
  imageUrl?: string | null;
  location?: string | null;
}

export interface PlayerUpsertInput {
  id: string;
  name: string;
  role: string;
  imageUrl?: string | null;
  isActive: boolean;
  nationality?: string | null;
  esportTeamId?: string | null;
}

export interface MatchUpsertInput {
  id: string;
  name: string;
  status: string;
  scheduledAt: Date;
  beginAt?: Date | null;
  endAt?: Date | null;
  teamAId?: string | null;
  teamBId?: string | null;
  winnerId?: string | null;
  teamAScore?: number | null;
  teamBScore?: number | null;
  tournamentName?: string | null;
  streamUrl?: string | null;
  matchType?: string | null;
  numberOfGames?: number | null;
  games?: any[] | null;
}

export interface PlayerPerformance {
  esportPlayerId: string;
  rawStats: Record<string, any>;
}

/** Per-game detail — `map`/`teamAScore`/`teamBScore` are only populated when a
 * source provides real per-game data (Valorant via vlr.gg, LoL via Leaguepedia);
 * `winner`/`length` mirror Pandascore's own raw `games` shape for backward
 * compatibility with matches that don't have an enriched source yet.
 *
 * `winnerSide` is the enriched sources' own winner signal, set independently
 * of `teamAScore`/`teamBScore` — for round-based games (Valorant) the higher
 * score IS the winner, but for LoL `teamAScore`/`teamBScore` are kill counts,
 * which do NOT reliably indicate who won the game (objective/backdoor wins
 * with fewer kills happen); never infer a winner from score comparison for
 * those sources, use this field instead. */
export interface GameDetail {
  id?: string | number;
  position?: number;
  status?: string;
  winner?: { id: string | null; type?: string } | null;
  winnerSide?: 'A' | 'B' | null;
  length?: number | null;
  map?: string | null;
  teamAScore?: number | null;
  teamBScore?: number | null;
}

/** Result of the "specialized API" stats fetch: per-player stats, plus
 * optionally enriched per-map data when the source provides it. */
export interface DetailedPerformancesResult {
  performances: PlayerPerformance[];
  games?: GameDetail[] | null;
}

/** Enough identity to look a player up by name on an external stats source. */
export interface PlayerRef {
  id: string;
  name: string;
}

/** A match already persisted in esport_db, as needed by fetchDetailedPerformances. */
export interface StoredMatchRef {
  id: string;
  scheduledAt: Date;
  teamAName?: string | null;
  teamBName?: string | null;
  games?: any;
}

export interface GameAdapter {
  readonly game: Game;
  readonly pandascoreSlug: string;

  /**
   * Whether `fetchDetailedPerformances` can return enriched per-game data
   * (real map name/score) for this game — used to decide whether it's worth
   * polling this game's `running` matches for live round-by-round progress.
   * Games without a specialized per-map source (CS, RL) skip that poll
   * entirely rather than waste calls that would never return `games`.
   */
  readonly supportsLiveGames?: boolean;

  mapTeam(raw: any): TeamUpsertInput;
  mapPlayer(raw: any): PlayerUpsertInput;
  mapMatch(raw: any): MatchUpsertInput;

  /**
   * Competitive-tier gate for a raw Pandascore match, based on `tournament.tier`
   * ('s'|'a'|'b'|'c'|'d', most to least prestigious — assigned per tournament
   * stage, not per league, so a Major's qualifiers can rank lower than its
   * playoffs). Games without a configured cutoff allow everything through.
   */
  isTournamentAllowed(raw: any): boolean;

  /**
   * The "specialized API" hook: detailed per-player stats for a finished match.
   * `players` carries names (not just IDs) because every external stats source
   * correlates a match by team name + date, then a row by player name — none
   * of them know our internal Pandascore-derived IDs.
   */
  fetchDetailedPerformances(match: StoredMatchRef, players: PlayerRef[]): Promise<DetailedPerformancesResult>;
}
