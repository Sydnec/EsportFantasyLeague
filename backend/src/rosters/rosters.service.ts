import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RosterValidationService } from './roster-validation.service.js';
import { CreateRosterDto } from './dto/create-roster.dto.js';
import { UpdateRosterDto } from './dto/update-roster.dto.js';

@Injectable()
export class RostersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private validationService: RosterValidationService,
  ) {}

  async create(userId: string, dto: CreateRosterDto) {
    // Validate membership
    const membership = await this.prisma.leagueMember.findUnique({
      where: {
        userId_leagueId: { userId, leagueId: dto.leagueId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this league');
    }

    // Run full validation pipeline
    await this.validationService.validate(
      userId,
      dto.leagueId,
      dto.matchDayId,
      dto.proPlayerIds,
    );

    // Create roster with picks in a transaction
    const roster = await this.prisma.$transaction(async (tx) => {
      return tx.roster.create({
        data: {
          userId,
          leagueId: dto.leagueId,
          matchDayId: dto.matchDayId,
          picks: {
            create: dto.proPlayerIds.map((proPlayerId, index) => ({
              proPlayerId,
              pickOrder: index + 1,
            })),
          },
        },
        include: {
          picks: {
            include: {
              proPlayer: {
                select: { id: true, name: true, team: true, role: true },
              },
            },
          },
          matchDay: {
            select: {
              date: true,
              game: true,
              lockTime: true,
              status: true,
            },
          },
        },
      });
    });

    // Audit log
    await this.auditService.log(userId, 'ROSTER_CREATED', 'Roster', roster.id, {
      leagueId: dto.leagueId,
      matchDayId: dto.matchDayId,
      proPlayerIds: dto.proPlayerIds,
    });

    return roster;
  }

  async update(userId: string, rosterId: string, dto: UpdateRosterDto) {
    const roster = await this.prisma.roster.findUnique({
      where: { id: rosterId },
      include: { matchDay: true },
    });

    if (!roster) {
      throw new NotFoundException('Roster not found');
    }

    if (roster.userId !== userId) {
      throw new ForbiddenException('You can only edit your own rosters');
    }

    if (roster.status !== 'PENDING') {
      throw new ForbiddenException('Cannot modify a locked or scored roster');
    }

    // Re-validate with new picks
    await this.validationService.validate(
      userId,
      roster.leagueId,
      roster.matchDayId,
      dto.proPlayerIds,
    );

    // Update in transaction: delete old picks, create new ones
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.rosterPick.deleteMany({ where: { rosterId } });

      return tx.roster.update({
        where: { id: rosterId },
        data: {
          picks: {
            create: dto.proPlayerIds.map((proPlayerId, index) => ({
              proPlayerId,
              pickOrder: index + 1,
            })),
          },
        },
        include: {
          picks: {
            include: {
              proPlayer: {
                select: { id: true, name: true, team: true, role: true },
              },
            },
          },
          matchDay: {
            select: {
              date: true,
              game: true,
              lockTime: true,
              status: true,
            },
          },
        },
      });
    });

    // Audit log
    await this.auditService.log(userId, 'ROSTER_UPDATED', 'Roster', rosterId, {
      proPlayerIds: dto.proPlayerIds,
    });

    return updated;
  }

  async findUserRosters(userId: string, leagueId?: string) {
    return this.prisma.roster.findMany({
      where: {
        userId,
        ...(leagueId && { leagueId }),
      },
      include: {
        picks: {
          include: {
            proPlayer: {
              select: {
                id: true,
                name: true,
                team: true,
                role: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { pickOrder: 'asc' },
        },
        matchDay: {
          select: {
            id: true,
            date: true,
            game: true,
            status: true,
            lockTime: true,
          },
        },
        league: { select: { id: true, name: true } },
      },
      orderBy: { matchDay: { date: 'desc' } },
    });
  }

  async findById(rosterId: string) {
    const roster = await this.prisma.roster.findUnique({
      where: { id: rosterId },
      include: {
        picks: {
          include: {
            proPlayer: {
              select: {
                id: true,
                name: true,
                team: true,
                role: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { pickOrder: 'asc' },
        },
        matchDay: true,
        league: {
          select: { id: true, name: true, games: true, tournaments: true },
        },
        user: { select: { id: true, username: true } },
      },
    });

    if (!roster) {
      throw new NotFoundException('Roster not found');
    }

    return roster;
  }

  async findLeagueRostersForMatchDay(leagueId: string, matchDayId: string) {
    return this.prisma.roster.findMany({
      where: { leagueId, matchDayId },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        picks: {
          include: {
            proPlayer: {
              select: { id: true, name: true, team: true, role: true },
            },
          },
          orderBy: { pickOrder: 'asc' },
        },
      },
      orderBy: { totalScore: { sort: 'desc', nulls: 'last' } },
    });
  }
}
