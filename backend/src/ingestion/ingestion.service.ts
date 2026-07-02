import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { ScoringService } from '../scoring/scoring.service.js';
import { PandaScoreService } from './pandascore.service.js';
import { MatchDayStatus, Game } from '@prisma/client';

@Injectable()
export class IngestionService implements OnModuleInit {
  private readonly logger = new Logger(IngestionService.name);
  private lastSyncTimes = new Map<Game, number>();

  constructor(
    private prisma: PrismaService,
    private scoringService: ScoringService,
    private pandaScoreService: PandaScoreService,
  ) {}

  async onModuleInit() {
    this.logger.log('Running initial sync on startup...');
    await this.syncPandaScoreMatches();
  }

  /**
   * Runs every 2 hours to sync upcoming matches from PandaScore.
   */
  @Cron('0 */2 * * *')
  async syncPandaScoreMatches() {
    this.logger.log('Starting big PandaScore synchronization...');
    for (const game of Object.values(Game)) {
      this.logger.log(`Syncing matches for ${game}...`);
      await this.pandaScoreService.syncUpcomingMatches(game);
    }
    this.logger.log('Finished big PandaScore synchronization. Launching point calculation...');
    await this.processLockedMatchDays();
  }

  /**
   * Runs every minute to update running match scores and statuses.
   */
  @Cron('* * * * *')
  async syncLiveMatchScores() {
    for (const game of Object.values(Game)) {
      const hasActiveMatches =
        await this.pandaScoreService.hasActiveMatches(game);
      const lastSync = this.lastSyncTimes.get(game) || 0;
      const timeSinceLastSync = Date.now() - lastSync;
      const tenMinutes = 10 * 60 * 1000;

      if (hasActiveMatches || timeSinceLastSync >= tenMinutes) {
        if (!hasActiveMatches) {
          this.logger.debug(`Fallback sync for ${game} (no sync in 10m)`);
        }
        await this.pandaScoreService.syncRunningMatches(game);
        this.lastSyncTimes.set(game, Date.now());
      }
    }
  }

  /**
   * Runs every 5 minutes. Targets LOCKED match days:
   * 1. Scores unscored DayPerformances via Strategy Pattern
   * 2. Calculates roster total scores
   * 3. Updates league member totals
   * 4. Transitions MatchDay to SCORED
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processLockedMatchDays() {
    const lockedMatchDays = await this.prisma.matchDay.findMany({
      where: { status: MatchDayStatus.LOCKED },
      include: {
        performances: {
          where: { score: null },
        },
      },
    });

    for (const matchDay of lockedMatchDays) {
      const matches = await this.prisma.match.findMany({
        where: { matchDayId: matchDay.id },
      });

      const allMatchesFinished =
        matches.length > 0 && matches.every((m) => m.status === 'finished');
      if (!allMatchesFinished) {
        continue; // Keep the matchday in LOCKED status until matches finish
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const allFinishedForOneHour = matches.every(
        (m) => m.finishedAt && m.finishedAt <= oneHourAgo,
      );

      if (!allFinishedForOneHour) {
        continue; // Wait until all matches have been finished for at least 1 hour
      }

      const unscoredPerformances = matchDay.performances.filter(
        (p) => p.score === null,
      );

      if (unscoredPerformances.length === 0) {
        await this.finalizeMatchDay(matchDay.id);
        continue;
      }

      this.logger.log(
        `Scoring ${unscoredPerformances.length} performances for match day ${matchDay.id}`,
      );

      for (const perf of unscoredPerformances) {
        const score = this.scoringService.calculate(
          matchDay.game,
          perf.rawStats as Record<string, unknown>,
        );

        await this.prisma.dayPerformance.update({
          where: { id: perf.id },
          data: { score },
        });
      }

      await this.finalizeMatchDay(matchDay.id);
    }
  }

  private async finalizeMatchDay(matchDayId: string) {
    const targetMatchDay = await this.prisma.matchDay.findUnique({
      where: { id: matchDayId },
      select: { date: true },
    });

    if (!targetMatchDay) return;

    // Transition the current matchDay to SCORED
    await this.prisma.matchDay.update({
      where: { id: matchDayId },
      data: { status: 'SCORED' },
    });

    // Check if all matchDays on this date are now SCORED
    const allMdsOnDate = await this.prisma.matchDay.findMany({
      where: { date: targetMatchDay.date },
    });

    const allScored = allMdsOnDate.every((md) => md.status === 'SCORED');

    if (!allScored) {
      this.logger.log(
        `Match day ${matchDayId} marked as SCORED. Waiting for sibling games on date ${
          targetMatchDay.date.toISOString().split('T')[0]
        } to finalize before scoring rosters.`,
      );
      return;
    }

    const siblingMdIds = allMdsOnDate.map((md) => md.id);
    const rosters = await this.prisma.roster.findMany({
      where: {
        matchDayId: { in: siblingMdIds },
        status: { not: 'SCORED' },
      },
      include: {
        picks: {
          include: {
            proPlayer: {
              include: {
                performances: {
                  where: { matchDayId: { in: siblingMdIds } },
                  select: { score: true },
                },
              },
            },
          },
        },
      },
    });

    for (const roster of rosters) {
      const totalScore = roster.picks.reduce((sum, pick) => {
        const perf = pick.proPlayer.performances[0];
        return sum + (perf?.score ?? 0);
      }, 0);

      const roundedScore = Math.round(totalScore * 100) / 100;

      await this.prisma.roster.update({
        where: { id: roster.id },
        data: {
          totalScore: roundedScore,
          status: 'SCORED',
        },
      });

      await this.prisma.leagueMember.update({
        where: {
          userId_leagueId: {
            userId: roster.userId,
            leagueId: roster.leagueId,
          },
        },
        data: {
          totalScore: { increment: roundedScore },
        },
      });
    }

    this.logger.log(
      `All match days on date ${
        targetMatchDay.date.toISOString().split('T')[0]
      } finalized. Scored ${rosters.length} rosters.`,
    );
  }
}
