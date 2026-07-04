import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRosterDto, UpdateRosterPicksDto } from './dto/rosters.dto';

@Injectable()
export class RostersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRosterDto) {
    // 1. Verifier que l'utilisateur est bien membre de la ligue
    const member = await this.prisma.fantasyLeagueMember.findUnique({
      where: {
        userId_fantasyLeagueId: {
          userId,
          fantasyLeagueId: dto.leagueId,
        },
      },
      include: {
        league: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this league');
    }

    // 2. Vérifier que la taille du roster est respectée
    if (dto.proPlayerIds.length > member.league.rosterSize) {
      throw new BadRequestException(`You can only pick up to ${member.league.rosterSize} players`);
    }

    // 3. Vérifier le cache MatchDay et lockTime
    const matchDay = await this.prisma.esportMatchDayCache.findUnique({
      where: { id: dto.matchDayId },
    });

    if (!matchDay) {
      throw new BadRequestException('Match Day not found in local cache. It might not be available yet.');
    }

    if (matchDay.status !== 'OPEN' || new Date() >= matchDay.lockTime) {
      throw new BadRequestException('This Match Day is locked and cannot accept new rosters');
    }

    // 4. Vérifier que les joueurs existent dans le cache
    const players = await this.prisma.esportPlayerCache.findMany({
      where: { id: { in: dto.proPlayerIds } },
    });
    if (players.length !== dto.proPlayerIds.length) {
      throw new BadRequestException('Some players could not be found');
    }

    // 5. Créer le roster et les picks
    const roster = await this.prisma.fantasyRoster.create({
      data: {
        userId,
        fantasyLeagueId: dto.leagueId,
        esportMatchDayId: dto.matchDayId,
        picks: {
          create: dto.proPlayerIds.map((playerId, index) => ({
            esportPlayerId: playerId,
            pickOrder: index,
          })),
        },
      },
      include: {
        picks: true,
      },
    });

    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      data: roster,
    };
  }

  async updatePicks(userId: string, id: string, dto: UpdateRosterPicksDto) {
    const roster = await this.prisma.fantasyRoster.findUnique({
      where: { id },
      include: { league: true, matchDay: true },
    });

    if (!roster) throw new NotFoundException('Roster not found');
    if (roster.userId !== userId) throw new ForbiddenException('You do not own this roster');

    if (roster.matchDay.status !== 'OPEN' || new Date() >= roster.matchDay.lockTime) {
      throw new BadRequestException('This Match Day is already locked');
    }

    if (dto.proPlayerIds.length > roster.league.rosterSize) {
      throw new BadRequestException(`You can only pick up to ${roster.league.rosterSize} players`);
    }

    // Verify players
    const players = await this.prisma.esportPlayerCache.findMany({
      where: { id: { in: dto.proPlayerIds } },
    });
    if (players.length !== dto.proPlayerIds.length) {
      throw new BadRequestException('Some players could not be found');
    }

    // Transaction pour supprimer les anciens picks et recréer les nouveaux
    await this.prisma.$transaction([
      this.prisma.fantasyRosterPick.deleteMany({
        where: { fantasyRosterId: roster.id },
      }),
      this.prisma.fantasyRoster.update({
        where: { id: roster.id },
        data: {
          picks: {
            create: dto.proPlayerIds.map((playerId, index) => ({
              esportPlayerId: playerId,
              pickOrder: index,
            })),
          },
        },
      }),
    ]);

    return this.findOne(roster.id);
  }

  async findAllForUser(userId: string) {
    const rosters = await this.prisma.fantasyRoster.findMany({
      where: { userId },
      include: {
        league: { select: { id: true, name: true } },
        matchDay: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      data: rosters,
    };
  }

  async findOne(id: string) {
    const roster = await this.prisma.fantasyRoster.findUnique({
      where: { id },
      include: {
        picks: {
          include: {
            esportPlayer: true,
          },
        },
        matchDay: true,
      },
    });

    if (!roster) throw new NotFoundException('Roster not found');

    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      data: roster,
    };
  }

  async findByLeagueAndMatchDay(leagueId: string, matchDayId: string) {
    const rosters = await this.prisma.fantasyRoster.findMany({
      where: {
        fantasyLeagueId: leagueId,
        esportMatchDayId: matchDayId,
      },
      include: {
        user: { select: { id: true, username: true } },
        picks: { include: { esportPlayer: true } },
      },
    });

    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      data: rosters,
    };
  }
}
