import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { Game, Prisma } from '@prisma/client-esport';
import { PrismaService } from '../prisma/prisma.service';
import { PandascoreService } from '../pandascore/pandascore.service';
import { GameAdapterRegistry } from '../adapters/game-adapter.registry';
import { GameAdapter, StoredMatchRef } from '../adapters/game-adapter.interface';
import { RABBITMQ_ROUTING_KEYS } from '@app/shared/rabbitmq/rabbitmq.constants';
import { BACKEND_ESPORT_RMQ_CLIENT, SCORING_RMQ_CLIENT } from './esport.constants';

@Injectable()
export class EsportService {
  private readonly logger = new Logger(EsportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pandascore: PandascoreService,
    private readonly adapterRegistry: GameAdapterRegistry,
    @Inject(BACKEND_ESPORT_RMQ_CLIENT) private readonly backendClient: ClientProxy,
    @Inject(SCORING_RMQ_CLIENT) private readonly scoringClient: ClientProxy,
  ) {}

  // ──────────────────────────────────────────────
  // CRON ORCHESTRATION
  // ──────────────────────────────────────────────

  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncTeamsAndPlayers() {
    for (const adapter of this.adapterRegistry.all()) {
      await this.runForGame(adapter, () => this.syncTeamsAndPlayersForGame(adapter));
    }
  }

  @Cron('0 */15 * * * *') // every 15 minutes — no CronExpression.EVERY_15_MINUTES constant exists
  async syncMatchDays() {
    for (const adapter of this.adapterRegistry.all()) {
      await this.runForGame(adapter, () => this.syncMatchDaysForGame(adapter));
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncFinishedMatchStats() {
    for (const adapter of this.adapterRegistry.all()) {
      await this.runForGame(adapter, () => this.ingestFinishedMatchStatsForGame(adapter));
    }
  }

  // Best-effort live round progress for matches still `running` — deliberately
  // separate from and less frequent than a true live feed: none of our
  // per-map sources (Leaguepedia, vlr.gg) expose in-progress round state, only
  // maps/games they've already recorded as finished, so this is "poll every
  // few minutes and show whatever's already final" rather than a real live feed.
  @Cron('0 */3 * * * *') // every 3 minutes
  async syncLiveMatchGames() {
    for (const adapter of this.adapterRegistry.all()) {
      if (!adapter.supportsLiveGames) continue;
      await this.runForGame(adapter, () => this.syncLiveMatchGamesForGame(adapter));
    }
  }

  private async runForGame(adapter: GameAdapter, task: () => Promise<void>) {
    try {
      await task();
    } catch (e: any) {
      this.logger.error(`Sync failed for ${adapter.game}: ${e.message}`, e.stack);
    }
  }

  // ──────────────────────────────────────────────
  // TEAMS & PLAYERS
  // ──────────────────────────────────────────────

  private async syncTeamsAndPlayersForGame(adapter: GameAdapter) {
    // Paginating Pandascore's un-scoped /{slug}/players is capped and mostly
    // returns players from teams that never play a synced match. Instead, fetch
    // full rosters only for teams that actually appear in a synced match — the
    // only ones that matter for fantasy picks — via the generic /teams endpoint,
    // which embeds each team's complete current roster.
    const matches = await this.prisma.esportMatch.findMany({
      where: { game: adapter.game },
      select: { teamAId: true, teamBId: true },
    });
    const teamIds = Array.from(
      new Set(matches.flatMap((m) => [m.teamAId, m.teamBId]).filter((tid): tid is string => !!tid)),
    );

    if (!teamIds.length) {
      this.logger.log(`No teams with synced matches yet for ${adapter.game}, skipping roster sync`);
      return;
    }

    const rawTeams = await this.pandascore.getTeamRosters(teamIds);
    let upsertedPlayerCount = 0;

    for (const rawTeam of rawTeams) {
      await this.upsertTeam(adapter, rawTeam);

      for (const rawPlayer of rawTeam.players ?? []) {
        if (!rawPlayer?.id || !rawPlayer?.name) continue;

        // Roster-embedded players don't carry a `current_team` back-reference
        // the way the old per-game player list did — attach one so mapPlayer()
        // resolves the esportTeamId FK correctly.
        const player = adapter.mapPlayer({ ...rawPlayer, current_team: { id: rawTeam.id } });

        await this.prisma.esportPlayer.upsert({
          where: { id: player.id },
          update: {
            name: player.name,
            role: player.role,
            imageUrl: player.imageUrl,
            isActive: player.isActive,
            nationality: player.nationality,
            esportTeamId: player.esportTeamId,
          },
          create: {
            id: player.id,
            name: player.name,
            role: player.role,
            imageUrl: player.imageUrl,
            isActive: player.isActive,
            nationality: player.nationality,
            esportTeamId: player.esportTeamId,
            game: adapter.game,
          },
        });

        this.backendClient.emit(RABBITMQ_ROUTING_KEYS.ESPORT_PLAYER_UPSERTED, {
          id: player.id,
          name: player.name,
          esportTeamId: player.esportTeamId ?? '',
          game: adapter.game,
          role: player.role,
          imageUrl: player.imageUrl ?? undefined,
          isActive: player.isActive,
        });
        upsertedPlayerCount++;
      }
    }

    this.logger.log(`Synced rosters for ${rawTeams.length} teams (${upsertedPlayerCount} players) for ${adapter.game}`);
  }

  private async upsertTeam(adapter: GameAdapter, raw: any) {
    if (!raw?.id || !raw?.name) return;

    const team = adapter.mapTeam(raw);
    await this.prisma.esportTeam.upsert({
      where: { id: team.id },
      update: { name: team.name, acronym: team.acronym, imageUrl: team.imageUrl, location: team.location },
      create: {
        id: team.id,
        name: team.name,
        acronym: team.acronym,
        imageUrl: team.imageUrl,
        location: team.location,
        game: adapter.game,
      },
    });

    this.backendClient.emit(RABBITMQ_ROUTING_KEYS.ESPORT_TEAM_UPSERTED, {
      id: team.id,
      name: team.name,
      acronym: team.acronym ?? undefined,
      imageUrl: team.imageUrl ?? undefined,
      game: adapter.game,
    });
  }

  // ──────────────────────────────────────────────
  // MATCH SCHEDULE (MATCH DAYS)
  // ──────────────────────────────────────────────

  private async syncMatchDaysForGame(adapter: GameAdapter) {
    const [upcoming, running, past] = await Promise.all([
      this.fetchAllPages((page, perPage) => this.pandascore.getUpcomingMatches(adapter.pandascoreSlug, page, perPage)),
      // Live matches — without this call a match jumps straight from
      // not_started to finished and never shows as "running" in between.
      this.fetchAllPages((page, perPage) => this.pandascore.getRunningMatches(adapter.pandascoreSlug, page, perPage)),
      // Recently-finished matches — this is also how a match's status
      // transitions from "running" to "finished" in our DB over time.
      this.fetchAllPages((page, perPage) => this.pandascore.getPastMatches(adapter.pandascoreSlug, page, perPage), 2),
    ]);

    const touchedMatchDayIds = new Set<string>();

    for (const raw of [...upcoming, ...running, ...past]) {
      if (!raw?.id) continue;
      if (!adapter.isTournamentAllowed(raw)) continue;

      for (const o of raw.opponents ?? []) {
        if (o?.opponent) await this.upsertTeam(adapter, o.opponent);
      }
      if (raw.winner) await this.upsertTeam(adapter, raw.winner);

      const match = adapter.mapMatch(raw);
      const matchDayId = this.matchDayId(adapter.game, match.scheduledAt);
      touchedMatchDayIds.add(matchDayId);

      await this.prisma.esportMatchDay.upsert({
        where: { id: matchDayId },
        update: {},
        create: {
          id: matchDayId,
          date: this.dateOnly(match.scheduledAt),
          game: adapter.game,
          lockTime: match.scheduledAt,
        },
      });

      await this.prisma.esportMatch.upsert({
        where: { id: match.id },
        update: {
          name: match.name,
          status: match.status,
          scheduledAt: match.scheduledAt,
          beginAt: match.beginAt,
          endAt: match.endAt,
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          winnerId: match.winnerId,
          teamAScore: match.teamAScore,
          teamBScore: match.teamBScore,
          tournamentName: match.tournamentName,
          streamUrl: match.streamUrl,
          matchType: match.matchType,
          numberOfGames: match.numberOfGames,
          // `games` is deliberately NOT overwritten here — see the guarded
          // updateMany below. Once a match has been stat-enriched (real
          // per-map score/map name from vlr.gg/Leaguepedia), Pandascore's raw
          // `games` blob is stale and must never clobber it again.
        },
        create: {
          id: match.id,
          esportMatchDayId: matchDayId,
          game: adapter.game,
          name: match.name,
          status: match.status,
          scheduledAt: match.scheduledAt,
          beginAt: match.beginAt,
          endAt: match.endAt,
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          winnerId: match.winnerId,
          teamAScore: match.teamAScore,
          teamBScore: match.teamBScore,
          tournamentName: match.tournamentName,
          streamUrl: match.streamUrl,
          matchType: match.matchType,
          numberOfGames: match.numberOfGames,
          games: match.games ?? undefined,
        },
      });

      // Keep Pandascore's raw `games` fresh while nothing has enriched it yet
      // (gamesEnrichedAt still null) — this is how CS/RL's Pandascore-only
      // fallback and pre-finish matches get their per-game data at all.
      // No-ops (0 rows matched) once either the live-progress poll or the
      // finished-stats ingestion has written real per-map data.
      await this.prisma.esportMatch.updateMany({
        where: { id: match.id, gamesEnrichedAt: null },
        data: { games: match.games ?? undefined },
      });
    }

    for (const matchDayId of touchedMatchDayIds) {
      await this.refreshMatchDayLockTimeAndEmit(matchDayId);
    }

    this.logger.log(`Synced ${upcoming.length + running.length + past.length} matches across ${touchedMatchDayIds.size} match days for ${adapter.game}`);
  }

  private matchDayId(game: Game, scheduledAt: Date): string {
    return `${game}_${this.dateOnly(scheduledAt).toISOString().slice(0, 10)}`;
  }

  private dateOnly(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  private async refreshMatchDayLockTimeAndEmit(matchDayId: string) {
    const matchDay = await this.prisma.esportMatchDay.findUnique({
      where: { id: matchDayId },
      include: { matches: true },
    });
    if (!matchDay || !matchDay.matches.length) return;

    const earliest = matchDay.matches.reduce(
      (min, m) => (m.scheduledAt < min ? m.scheduledAt : min),
      matchDay.matches[0].scheduledAt,
    );

    const updated = await this.prisma.esportMatchDay.update({
      where: { id: matchDayId },
      data: { lockTime: earliest },
    });

    this.emitMatchDayUpserted(updated);
  }

  private emitMatchDayUpserted(matchDay: { id: string; date: Date; game: Game; lockTime: Date; status: string }) {
    this.backendClient.emit(RABBITMQ_ROUTING_KEYS.ESPORT_MATCHDAY_UPSERTED, {
      id: matchDay.id,
      date: matchDay.date.toISOString().slice(0, 10),
      game: matchDay.game,
      lockTime: matchDay.lockTime.toISOString(),
      status: matchDay.status,
    });
  }

  // ──────────────────────────────────────────────
  // FINISHED MATCH STATS → SCORING
  // ──────────────────────────────────────────────

  private async ingestFinishedMatchStatsForGame(adapter: GameAdapter) {
    const finishedMatches = await this.prisma.esportMatch.findMany({
      where: { game: adapter.game, status: 'finished', statsFetchedAt: null },
      include: { teamA: true, teamB: true },
    });
    if (!finishedMatches.length) return;

    const touchedMatchDayIds = new Set<string>();

    for (const match of finishedMatches) {
      const teamIds = [match.teamAId, match.teamBId].filter((id): id is string => !!id);
      const players = teamIds.length
        ? await this.prisma.esportPlayer.findMany({ where: { esportTeamId: { in: teamIds } } })
        : [];
      const playerRefs = players.map((p) => ({ id: p.id, name: p.name }));

      if (!playerRefs.length) {
        // Roster not synced yet for these teams (e.g. right after a DB reset,
        // before the players cron/sync has run) — skip without marking
        // statsFetchedAt, so this match is retried once rosters exist instead
        // of being permanently skipped with zero performances.
        this.logger.warn(`No roster synced yet for match ${match.id} (${adapter.game}) — will retry later.`);
        continue;
      }

      const matchRef: StoredMatchRef = {
        id: match.id,
        scheduledAt: match.scheduledAt,
        teamAName: match.teamA?.name ?? null,
        teamBName: match.teamB?.name ?? null,
        games: match.games,
      };
      const { performances, games } = await adapter.fetchDetailedPerformances(matchRef, playerRefs);

      for (const perf of performances) {
        await this.prisma.esportPlayerMatchDayPerformance.upsert({
          where: {
            esportPlayerId_esportMatchDayId: {
              esportPlayerId: perf.esportPlayerId,
              esportMatchDayId: match.esportMatchDayId,
            },
          },
          update: { rawStats: perf.rawStats },
          create: {
            esportPlayerId: perf.esportPlayerId,
            esportMatchDayId: match.esportMatchDayId,
            rawStats: perf.rawStats,
          },
        });
      }

      await this.prisma.esportMatch.update({
        where: { id: match.id },
        data: {
          statsFetchedAt: new Date(),
          // Only overwrite with enriched per-map data when the source actually
          // returned some — otherwise keep Pandascore's original games blob.
          ...(games?.length ? { games: games as unknown as Prisma.InputJsonValue, gamesEnrichedAt: new Date() } : {}),
        },
      });
      touchedMatchDayIds.add(match.esportMatchDayId);
    }

    for (const matchDayId of touchedMatchDayIds) {
      await this.finalizeMatchDayIfComplete(matchDayId);
    }
  }

  // ──────────────────────────────────────────────
  // LIVE ROUND PROGRESS (running matches, best-effort)
  // ──────────────────────────────────────────────

  private async syncLiveMatchGamesForGame(adapter: GameAdapter) {
    const runningMatches = await this.prisma.esportMatch.findMany({
      where: { game: adapter.game, status: 'running' },
      include: { teamA: true, teamB: true },
    });
    if (!runningMatches.length) return;

    for (const match of runningMatches) {
      const teamIds = [match.teamAId, match.teamBId].filter((id): id is string => !!id);
      const players = teamIds.length
        ? await this.prisma.esportPlayer.findMany({ where: { esportTeamId: { in: teamIds } } })
        : [];
      if (!players.length) continue; // roster not synced yet — try again next tick

      const playerRefs = players.map((p) => ({ id: p.id, name: p.name }));
      const matchRef: StoredMatchRef = {
        id: match.id,
        scheduledAt: match.scheduledAt,
        teamAName: match.teamA?.name ?? null,
        teamBName: match.teamB?.name ?? null,
        games: match.games,
      };

      // Deliberately reuse the same "specialized API" lookup as the finished
      // flow, but only keep `games` — none of our sources expose in-progress
      // round state, so whatever comes back here is only maps/games already
      // recorded as done on their end. We never touch player performances or
      // statsFetchedAt from this path; that stays the finished-match flow's job.
      let games;
      try {
        ({ games } = await adapter.fetchDetailedPerformances(matchRef, playerRefs));
      } catch (e: any) {
        this.logger.warn(`Live game-progress lookup failed for match ${match.id} (${adapter.game}): ${e.message}`);
        continue;
      }
      if (!games?.length) continue;

      await this.prisma.esportMatch.update({
        where: { id: match.id },
        data: { games: games as unknown as Prisma.InputJsonValue, gamesEnrichedAt: new Date() },
      });
    }
  }

  private async finalizeMatchDayIfComplete(matchDayId: string) {
    const matchDay = await this.prisma.esportMatchDay.findUnique({
      where: { id: matchDayId },
      include: { matches: true },
    });
    if (!matchDay || matchDay.status === 'SCORED') return;

    const allProcessed =
      matchDay.matches.length > 0 &&
      matchDay.matches.every((m) => m.status === 'finished' && m.statsFetchedAt != null);
    if (!allProcessed) return;

    const performances = await this.prisma.esportPlayerMatchDayPerformance.findMany({
      where: { esportMatchDayId: matchDayId },
    });
    if (!performances.length) return;

    this.scoringClient.emit(RABBITMQ_ROUTING_KEYS.ESPORT_PERFORMANCE_INGESTED, {
      esportMatchDayId: matchDayId,
      performances: performances.map((p) => ({ esportPlayerId: p.esportPlayerId, rawStats: p.rawStats })),
    });

    const updated = await this.prisma.esportMatchDay.update({
      where: { id: matchDayId },
      data: { status: 'SCORED' },
    });
    this.emitMatchDayUpserted(updated);

    this.logger.log(`Match day ${matchDayId} fully scored, published ${performances.length} performances`);
  }

  // ──────────────────────────────────────────────
  // SHARED HELPERS
  // ──────────────────────────────────────────────

  private async fetchAllPages<T>(
    fetchFn: (page: number, perPage: number) => Promise<T[]>,
    maxPages = 3,
    perPage = 100,
  ): Promise<T[]> {
    const results: T[] = [];
    for (let page = 1; page <= maxPages; page++) {
      const batch = await fetchFn(page, perPage);
      if (!batch?.length) break;
      results.push(...batch);
      if (batch.length < perPage) break;
    }
    return results;
  }

  // ──────────────────────────────────────────────
  // MANUAL TRIGGERS (admin/testing — same code path as the cron jobs)
  // ──────────────────────────────────────────────

  async syncPlayers(game: Game) {
    await this.syncTeamsAndPlayersForGame(this.adapterRegistry.get(game));
    return { statusCode: 200, timestamp: new Date().toISOString(), data: `Synced teams/players for ${game}` };
  }

  async syncMatches(game: Game) {
    await this.syncMatchDaysForGame(this.adapterRegistry.get(game));
    return { statusCode: 200, timestamp: new Date().toISOString(), data: `Synced match days for ${game}` };
  }

  async syncStats(game: Game) {
    await this.ingestFinishedMatchStatsForGame(this.adapterRegistry.get(game));
    return { statusCode: 200, timestamp: new Date().toISOString(), data: `Ingested finished-match stats for ${game}` };
  }

  async syncLiveGames(game: Game) {
    const adapter = this.adapterRegistry.get(game);
    if (!adapter.supportsLiveGames) {
      return { statusCode: 200, timestamp: new Date().toISOString(), data: `${game} has no live per-map source, nothing to do` };
    }
    await this.syncLiveMatchGamesForGame(adapter);
    return { statusCode: 200, timestamp: new Date().toISOString(), data: `Synced live game progress for ${game}` };
  }

  // ──────────────────────────────────────────────
  // READ ENDPOINTS
  // ──────────────────────────────────────────────

  async getProPlayers(filters: { game?: Game; team?: string; role?: string }) {
    const players = await this.prisma.esportPlayer.findMany({
      where: {
        game: filters.game,
        role: filters.role,
        team: filters.team ? { OR: [{ id: filters.team }, { name: filters.team }] } : undefined,
      },
      include: { team: true },
      take: 200,
    });
    return { statusCode: 200, timestamp: new Date().toISOString(), data: players };
  }

  async getProPlayerById(id: string) {
    const player = await this.prisma.esportPlayer.findUnique({
      where: { id },
      include: {
        team: true,
        performances: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    return { statusCode: 200, timestamp: new Date().toISOString(), data: player };
  }

  async getProPlayersByMatchDay(matchDayId: string) {
    const matchDay = await this.prisma.esportMatchDay.findUnique({
      where: { id: matchDayId },
      include: { matches: true },
    });
    if (!matchDay) {
      return { statusCode: 200, timestamp: new Date().toISOString(), data: [] };
    }

    const teamIds = matchDay.matches.flatMap((m) => [m.teamAId, m.teamBId]).filter((id): id is string => !!id);
    const players = await this.prisma.esportPlayer.findMany({
      where: { esportTeamId: { in: teamIds } },
      include: { team: true },
    });
    return { statusCode: 200, timestamp: new Date().toISOString(), data: players };
  }

  async getUpcomingMatchDays(filters: { game?: Game; status?: string; date?: string }) {
    const matchDays = await this.prisma.esportMatchDay.findMany({
      where: {
        game: filters.game,
        status: filters.status as any,
        date: filters.date ? new Date(filters.date) : undefined,
      },
      include: { matches: { include: { teamA: true, teamB: true, winner: true } } },
      orderBy: { date: 'asc' },
    });
    return { statusCode: 200, timestamp: new Date().toISOString(), data: matchDays };
  }

  async getMatchDayById(id: string) {
    const matchDay = await this.prisma.esportMatchDay.findUnique({
      where: { id },
      include: {
        matches: { include: { teamA: true, teamB: true, winner: true } },
        performances: true,
      },
    });
    return { statusCode: 200, timestamp: new Date().toISOString(), data: matchDay };
  }

  async getMatchById(id: string) {
    const match = await this.prisma.esportMatch.findUnique({
      where: { id },
      include: {
        teamA: { include: { players: true } },
        teamB: { include: { players: true } },
        winner: true,
        matchDay: { include: { performances: { include: { player: true } } } },
      },
    });

    // The frontend expects `proPlayerId`/`proPlayer` on each performance —
    // the Prisma model itself names that relation `esportPlayerId`/`player`.
    const data = match?.matchDay
      ? {
          ...match,
          matchDay: {
            ...match.matchDay,
            performances: match.matchDay.performances.map((perf: any) => ({
              ...perf,
              proPlayerId: perf.esportPlayerId,
              proPlayer: perf.player,
            })),
          },
        }
      : match;

    return { statusCode: 200, timestamp: new Date().toISOString(), data };
  }
}
