import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLeagueDto } from './dto/create-league.dto.js';
import { nanoid } from 'nanoid';

@Injectable()
export class LeaguesService {
  constructor(private prisma: PrismaService) {}

  async getUpcomingTournaments() {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const matches = await this.prisma.match.findMany({
      where: {
        scheduledAt: {
          gte: now,
          lte: thirtyDaysLater,
        },
        tournamentName: {
          not: null,
        },
      },
      select: {
        tournamentName: true,
        matchDay: {
          select: {
            game: true,
          },
        },
      },
    });

    const grouped: Record<string, string[]> = {};
    matches.forEach((m) => {
      const game = m.matchDay.game;
      const tName = m.tournamentName;
      if (tName && tName.trim() !== '') {
        if (!grouped[game]) grouped[game] = [];
        if (!grouped[game].includes(tName)) {
          grouped[game].push(tName);
        }
      }
    });

    return grouped;
  }

  async create(userId: string, dto: CreateLeagueDto) {
    const inviteCode = nanoid(10);

    const league = await this.prisma.league.create({
      data: {
        ...dto,
        inviteCode,
        createdById: userId,
        members: {
          create: { userId },
        },
      },
      include: { members: true },
    });

    return league;
  }

  async findUserLeagues(userId: string) {
    return this.prisma.league.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        members: {
          select: {
            id: true,
            totalScore: true,
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
          orderBy: { totalScore: 'desc' },
        },
        _count: { select: { members: true } },
      },
    });
  }

  async findById(leagueId: string) {
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        members: {
          select: {
            id: true,
            totalScore: true,
            joinedAt: true,
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
          orderBy: { totalScore: 'desc' },
        },
      },
    });

    if (!league) {
      throw new NotFoundException('League not found');
    }

    return league;
  }

  async join(userId: string, inviteCode: string) {
    const league = await this.prisma.league.findUnique({
      where: { inviteCode },
      include: { _count: { select: { members: true } } },
    });

    if (!league) {
      throw new NotFoundException('Invalid invite code');
    }

    if (league._count.members >= league.maxMembers) {
      throw new ForbiddenException('League is full');
    }

    const existingMember = await this.prisma.leagueMember.findUnique({
      where: {
        userId_leagueId: { userId, leagueId: league.id },
      },
    });

    if (existingMember) {
      throw new ConflictException('Already a member of this league');
    }

    await this.prisma.leagueMember.create({
      data: { userId, leagueId: league.id },
    });

    return this.findById(league.id);
  }

  async getLeaderboard(leagueId: string) {
    return this.prisma.leagueMember.findMany({
      where: { leagueId },
      select: {
        id: true,
        totalScore: true,
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { totalScore: 'desc' },
    });
  }

  async remove(userId: string, leagueId: string) {
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      throw new NotFoundException('League not found');
    }

    if (league.createdById !== userId) {
      throw new ForbiddenException('Only the creator can delete this league');
    }

    return this.prisma.league.delete({
      where: { id: leagueId },
    });
  }
}
