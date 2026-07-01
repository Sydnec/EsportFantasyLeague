import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Validates roster submissions in strict sequential order:
 * 1. Roster size matches league.rosterSize
 * 2. MatchDay is still OPEN (server-side lock check)
 * 3. All players have a DayPerformance for this MatchDay
 * 4. No player is in cooldown period
 */
@Injectable()
export class RosterValidationService {
  constructor(private prisma: PrismaService) {}

  async validate(
    userId: string,
    leagueId: string,
    matchDayId: string,
    proPlayerIds: string[],
  ): Promise<void> {
    // ── Step 1: Validate roster size ──
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      throw new BadRequestException('League not found');
    }

    if (proPlayerIds.length !== league.rosterSize) {
      throw new BadRequestException(
        `Roster must have exactly ${league.rosterSize} players, got ${proPlayerIds.length}`,
      );
    }

    // Check for duplicates
    const uniqueIds = new Set(proPlayerIds);
    if (uniqueIds.size !== proPlayerIds.length) {
      throw new BadRequestException('Duplicate players in roster');
    }

    // ── Step 2: Validate match day is OPEN (server-side authority) ──
    const matchDay = await this.prisma.matchDay.findUnique({
      where: { id: matchDayId },
      include: {
        matches: { select: { scheduledAt: true, tournamentName: true } },
      },
    });

    if (!matchDay) {
      throw new BadRequestException('Match day not found');
    }

    // Verify game matches league
    if (!league.games.includes(matchDay.game)) {
      throw new BadRequestException(
        'Match day game does not match league game',
      );
    }

    // Compute effective lock time for THIS league:
    // = 1h before the earliest match that belongs to the league's tournaments
    const isAllSelected = league.tournaments.includes(`ALL:${matchDay.game}`);
    const relevantMatches = matchDay.matches.filter((m) => {
      if (isAllSelected) return true;
      return league.tournaments.includes(m.tournamentName ?? '');
    });

    if (relevantMatches.length === 0) {
      throw new BadRequestException(
        'No relevant matches for this league on this day',
      );
    }

    const earliestMatchTime = relevantMatches
      .map((m) => new Date(m.scheduledAt).getTime())
      .sort((a, b) => a - b)[0];
    const effectiveLockTime = new Date(earliestMatchTime - 60 * 60 * 1000);

    if (new Date() >= effectiveLockTime) {
      throw new ForbiddenException(
        'Match day is locked for this league — rosters can no longer be modified',
      );
    }

    // ── Step 3: Validate all players have a match this day ──
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

    const teamIds = new Set<string>();
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
    const missingPlayers = proPlayerIds.filter(
      (id) => !playingPlayerIds.has(id),
    );

    if (missingPlayers.length > 0) {
      throw new BadRequestException(
        `The following players do not have a match on this day: ${missingPlayers.join(', ')}`,
      );
    }

    // ── Step 4: Validate cooldown (based on played match days, not calendar days) ──
    // Find the N most recent match days (before the current one) that are relevant
    // to this league's games and tournaments. Only these count as cooldown slots.
    const relevantMatchDays = await this.prisma.matchDay.findMany({
      where: {
        game: { in: league.games },
        date: { lt: matchDay.date },
      },
      include: {
        matches: { select: { tournamentName: true } },
      },
      orderBy: { date: 'desc' },
      // Fetch more than needed to account for tournament filtering
      take: league.cooldownDays * 3,
    });

    // Filter to only match days that have at least one match in the league's tournaments
    const cooldownMatchDayIds = relevantMatchDays
      .filter((md) => {
        return md.matches.some((m) => {
          const isAllSelected = league.tournaments.includes(`ALL:${md.game}`);
          if (isAllSelected) return true;
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
        const cooldownPlayers = recentPicks.map(
          (p) =>
            `${p.proPlayer.name} (picked on ${p.roster.matchDay.date.toISOString().split('T')[0]})`,
        );
        throw new ForbiddenException(
          `The following players are in cooldown (${league.cooldownDays} match days): ${cooldownPlayers.join(', ')}`,
        );
      }
    }
  }
}
