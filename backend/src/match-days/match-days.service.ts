import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { Game, MatchDayStatus } from '@prisma/client';

@Injectable()
export class MatchDaysService {
  private readonly logger = new Logger(MatchDaysService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    game?: Game;
    status?: MatchDayStatus;
    date?: string;
  }) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 2);
    minDate.setHours(0, 0, 0, 0);

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    maxDate.setHours(23, 59, 59, 999);

    return this.prisma.matchDay.findMany({
      where: {
        ...(filters?.game && { game: filters.game }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.date
          ? { date: new Date(filters.date) }
          : {
              date: { gte: minDate, lte: maxDate },
            }),
      },
      include: {
        _count: { select: { performances: true, rosters: true } },
        matches: {
          include: { teamA: true, teamB: true },
          orderBy: [
            { scheduledAt: 'asc' },
            { id: 'asc' },
          ],
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findById(id: string) {
    const matchDay = await this.prisma.matchDay.findUnique({
      where: { id },
      include: {
        performances: {
          include: {
            proPlayer: {
              select: { id: true, name: true, team: true, role: true },
            },
          },
          orderBy: { score: { sort: 'desc', nulls: 'last' } },
        },
        matches: {
          include: { teamA: true, teamB: true },
          orderBy: [
            { scheduledAt: 'asc' },
            { id: 'asc' },
          ],
        },
      },
    });

    if (!matchDay) {
      throw new NotFoundException('Match day not found');
    }

    return matchDay;
  }

  /**
   * Server-authoritative lock: runs every minute.
   * Transitions OPEN → LOCKED when lockTime is reached.
   * Also locks all PENDING rosters for newly locked match days.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoLockMatchDays() {
    const now = new Date();

    const result = await this.prisma.matchDay.updateMany({
      where: {
        status: MatchDayStatus.OPEN,
        lockTime: { lte: now },
      },
      data: { status: MatchDayStatus.LOCKED },
    });

    if (result.count > 0) {
      this.logger.log(`Auto-locked ${result.count} match day(s)`);

      // Lock all PENDING rosters for these match days
      await this.prisma.roster.updateMany({
        where: {
          status: 'PENDING',
          matchDay: {
            status: MatchDayStatus.LOCKED,
          },
        },
        data: { status: 'LOCKED' },
      });
    }
  }
}
