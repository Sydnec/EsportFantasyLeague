import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Game } from '@prisma/client';

@Injectable()
export class ProPlayersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { game?: Game; team?: string; role?: string }) {
    return this.prisma.proPlayer.findMany({
      where: {
        isActive: true,
        ...(filters?.game && { game: filters.game }),
        ...(filters?.team && {
          team: {
            name: { contains: filters.team, mode: 'insensitive' as const },
          },
        }),
        ...(filters?.role && {
          role: { contains: filters.role, mode: 'insensitive' as const },
        }),
      },
      include: { team: true },
      orderBy: [{ team: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async findById(id: string) {
    const player = await this.prisma.proPlayer.findUnique({
      where: { id },
      include: {
        team: true,
        performances: {
          orderBy: { matchDay: { date: 'desc' } },
          take: 10,
          include: {
            matchDay: {
              select: { date: true, game: true, status: true },
            },
          },
        },
      },
    });

    if (!player) {
      throw new NotFoundException('Pro player not found');
    }

    return player;
  }

  async findByMatchDay(matchDayId: string) {
    const matchDay = await this.prisma.matchDay.findUnique({
      where: { id: matchDayId },
      include: {
        matches: {
          select: {
            teamAId: true,
            teamBId: true,
          },
        },
      },
    });

    if (!matchDay) return [];

    const teamIds = new Set<string>();
    matchDay.matches.forEach((m) => {
      teamIds.add(m.teamAId);
      teamIds.add(m.teamBId);
    });

    const teamIdsArray = Array.from(teamIds);

    return this.prisma.proPlayer.findMany({
      where: {
        isActive: true,
        game: matchDay.game,
        teamId: { in: teamIdsArray },
      },
      include: {
        team: true,
        performances: {
          where: { matchDayId },
          select: { id: true, score: true },
        },
      },
    });
  }
}
