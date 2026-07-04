import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeagueDto, JoinLeagueDto } from './dto/leagues.dto';
import * as crypto from 'crypto';

@Injectable()
export class LeaguesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateLeagueDto) {
    const inviteCode = `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const league = await this.prisma.fantasyLeague.create({
      data: {
        name: dto.name,
        games: dto.games,
        tournaments: dto.tournaments || [],
        rosterSize: dto.rosterSize,
        cooldownDays: dto.cooldownDays,
        onlyCreatorInvites: dto.onlyCreatorInvites || false,
        inviteCode,
        createdByUserId: userId,
        members: {
          create: {
            userId: userId,
          },
        },
      },
      include: {
        members: true,
      },
    });

    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      data: league,
    };
  }

  async findAllForUser(userId: string) {
    const leagues = await this.prisma.fantasyLeague.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      data: leagues,
    };
  }

  async findOne(id: string) {
    const league = await this.prisma.fantasyLeague.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!league) throw new NotFoundException('League not found');

    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      data: league,
    };
  }

  async remove(userId: string, id: string) {
    const league = await this.prisma.fantasyLeague.findUnique({
      where: { id },
    });

    if (!league) throw new NotFoundException('League not found');
    if (league.createdByUserId !== userId) {
      throw new ForbiddenException('Only the creator can delete this league');
    }

    await this.prisma.fantasyLeague.delete({ where: { id } });

    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      data: 'League deleted successfully',
    };
  }

  async join(userId: string, id: string, dto: JoinLeagueDto) {
    const league = await this.prisma.fantasyLeague.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!league) throw new NotFoundException('League not found');
    if (league.inviteCode !== dto.inviteCode) {
      throw new BadRequestException('Invalid invite code');
    }
    if (league.members.length >= league.maxMembers) {
      throw new BadRequestException('League is full');
    }
    if (league.members.some((m) => m.userId === userId)) {
      throw new BadRequestException('You are already a member of this league');
    }

    await this.prisma.fantasyLeagueMember.create({
      data: {
        userId,
        fantasyLeagueId: league.id,
      },
    });

    return this.findOne(league.id);
  }

  async getLeaderboard(leagueId: string) {
    const league = await this.prisma.fantasyLeague.findUnique({
      where: { id: leagueId },
    });

    if (!league) throw new NotFoundException('League not found');

    const members = await this.prisma.fantasyLeagueMember.findMany({
      where: { fantasyLeagueId: leagueId },
      orderBy: { totalScore: 'desc' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      data: members,
    };
  }

  async getUpcomingTournamentsMock() {
    // Bouchon temporaire pour simuler les données venant du module Esport Adapter
    const mockData = {
      LEAGUE_OF_LEGENDS: [
        { id: 't_lol_1', name: 'LEC Summer 2026', startDate: '2026-06-15' },
        { id: 't_lol_2', name: 'Worlds 2026', startDate: '2026-09-25' },
      ],
      VALORANT: [
        { id: 't_val_1', name: 'VCT EMEA Stage 2', startDate: '2026-05-20' },
      ],
    };

    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      data: mockData,
    };
  }
}
