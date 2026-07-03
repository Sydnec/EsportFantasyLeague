import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        teamA: {
          include: { players: { where: { isActive: true } } }
        },
        teamB: {
          include: { players: { where: { isActive: true } } }
        },
        winner: true,
        matchDay: {
          include: {
            performances: {
              include: {
                proPlayer: {
                  select: { id: true, name: true, team: true, role: true, imageUrl: true },
                },
              },
            },
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const relevantTeamIds = [match.teamAId, match.teamBId];
    const filteredPerformances = match.matchDay.performances.filter(p => 
      p.proPlayer.team && relevantTeamIds.includes(p.proPlayer.team.id)
    );

    return {
      ...match,
      matchDay: {
        ...match.matchDay,
        performances: filteredPerformances,
      },
    };
  }
}
