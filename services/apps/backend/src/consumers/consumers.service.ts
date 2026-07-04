import { Injectable, Logger } from '@nestjs/common';
import { Game, EsportMatchDayStatus } from '@prisma/client-backend';
import { PrismaService } from '../prisma/prisma.service';
import { EsportPlayerUpsertedDto } from '@app/shared/rabbitmq/dtos/esport.player.upserted.dto';
import { EsportTeamUpsertedDto } from '@app/shared/rabbitmq/dtos/esport.team.upserted.dto';
import { EsportMatchDayUpsertedDto } from '@app/shared/rabbitmq/dtos/esport.matchday.upserted.dto';
import { ScoringPointsCalculatedDto } from '@app/shared/rabbitmq/dtos/scoring.points.calculated.dto';

@Injectable()
export class ConsumersService {
  private readonly logger = new Logger(ConsumersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleEsportPlayerUpserted(payload: EsportPlayerUpsertedDto) {
    this.logger.log(`Received esport.player.upserted for ${payload.id}`);
    
    // Convert string game to enum
    const game = payload.game as Game;

    await this.prisma.esportPlayerCache.upsert({
      where: { id: payload.id },
      update: {
        name: payload.name,
        esportTeamId: payload.esportTeamId,
        game,
        role: payload.role,
        imageUrl: payload.imageUrl,
        isActive: payload.isActive,
        updatedAt: new Date(),
      },
      create: {
        id: payload.id,
        name: payload.name,
        esportTeamId: payload.esportTeamId,
        game,
        role: payload.role,
        imageUrl: payload.imageUrl,
        isActive: payload.isActive,
        updatedAt: new Date(),
      },
    });
  }

  async handleEsportTeamUpserted(payload: EsportTeamUpsertedDto) {
    this.logger.log(`Received esport.team.upserted for ${payload.id}`);

    const game = payload.game as Game;

    await this.prisma.esportTeamCache.upsert({
      where: { id: payload.id },
      update: {
        name: payload.name,
        acronym: payload.acronym,
        imageUrl: payload.imageUrl,
        game,
        updatedAt: new Date(),
      },
      create: {
        id: payload.id,
        name: payload.name,
        acronym: payload.acronym,
        imageUrl: payload.imageUrl,
        game,
        updatedAt: new Date(),
      },
    });
  }

  async handleEsportMatchDayUpserted(payload: EsportMatchDayUpsertedDto) {
    this.logger.log(`Received esport.matchday.upserted for ${payload.id}`);

    const game = payload.game as Game;
    const status = payload.status as EsportMatchDayStatus;

    await this.prisma.esportMatchDayCache.upsert({
      where: { id: payload.id },
      update: {
        date: new Date(payload.date),
        game,
        lockTime: new Date(payload.lockTime),
        status,
        updatedAt: new Date(),
      },
      create: {
        id: payload.id,
        date: new Date(payload.date),
        game,
        lockTime: new Date(payload.lockTime),
        status,
        updatedAt: new Date(),
      },
    });
  }

  async handleScoringPointsCalculated(payload: ScoringPointsCalculatedDto) {
    this.logger.log(`Received scoring.points.calculated for MatchDay ${payload.esportMatchDayId}`);

    const { esportMatchDayId, performances } = payload;
    const scoresMap = new Map(performances.map((p) => [p.esportPlayerId, p.score]));

    // Find all rosters for this match day
    const rosters = await this.prisma.fantasyRoster.findMany({
      where: { esportMatchDayId },
      include: {
        picks: true,
      },
    });

    for (const roster of rosters) {
      let rosterScore = 0;

      // Calculate roster score
      for (const pick of roster.picks) {
        const playerScore = scoresMap.get(pick.esportPlayerId) || 0;
        rosterScore += playerScore;
      }

      // Update Roster Score and Status
      await this.prisma.fantasyRoster.update({
        where: { id: roster.id },
        data: {
          calculatedRosterScore: rosterScore,
          status: 'SCORED',
        },
      });

      // Recalculate Total Score for the League Member
      const member = await this.prisma.fantasyLeagueMember.findUnique({
        where: {
          userId_fantasyLeagueId: {
            userId: roster.userId,
            fantasyLeagueId: roster.fantasyLeagueId,
          },
        },
      });

      if (member) {
        // Aggregate all SCORED rosters for this user in this league
        const allScoredRosters = await this.prisma.fantasyRoster.findMany({
          where: {
            userId: roster.userId,
            fantasyLeagueId: roster.fantasyLeagueId,
            status: 'SCORED',
          },
        });

        const newTotal = allScoredRosters.reduce(
          (acc, r) => acc + (r.calculatedRosterScore || 0),
          0,
        );

        await this.prisma.fantasyLeagueMember.update({
          where: { id: member.id },
          data: { totalScore: newTotal },
        });
      }
    }
  }
}
