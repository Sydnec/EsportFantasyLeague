import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Game } from '@prisma/client-esport';
import { PandascoreService } from '../pandascore/pandascore.service';
import { PrismaService } from '../prisma/prisma.service';
import { RABBITMQ_ROUTING_KEYS } from '@app/shared/rabbitmq/rabbitmq.constants';

@Injectable()
export class EsportService {
  private readonly logger = new Logger(EsportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pandascore: PandascoreService,
    @Inject('RABBITMQ_CLIENT') private readonly rmqClient: ClientProxy,
  ) {}

  async syncPlayers(gameSlug: string = 'lol') {
    this.logger.log(`Syncing players for ${gameSlug}...`);
    try {
      const players = await this.pandascore.getPlayers(gameSlug, 1, 50);
      let upsertedCount = 0;

      for (const p of players) {
        if (!p.id || !p.name) continue;
        
        const gameEnum = gameSlug.toUpperCase() === 'LOL' ? Game.LEAGUE_OF_LEGENDS : Game.VALORANT;
        
        await this.prisma.esportPlayer.upsert({
          where: { id: p.id.toString() },
          update: {
            name: p.name,
            imageUrl: p.image_url,
            isActive: p.active,
          },
          create: {
            id: p.id.toString(),
            name: p.name,
            role: p.role || 'NONE',
            game: gameEnum,
            imageUrl: p.image_url,
            isActive: p.active,
            esportTeamId: p.current_team?.id?.toString() || null,
          },
        });

        // Publish event to RMQ
        this.rmqClient.emit(RABBITMQ_ROUTING_KEYS.ESPORT_PLAYER_UPSERTED, {
          id: p.id.toString(),
          name: p.name,
          esportTeamId: p.current_team?.id?.toString() || '',
          game: gameEnum,
          role: p.role || 'NONE',
          imageUrl: p.image_url,
          isActive: p.active,
        });

        upsertedCount++;
      }

      return {
        statusCode: 200,
        message: `Synced ${upsertedCount} players`,
      };
    } catch (e: any) {
      this.logger.error('Failed to sync players', e);
      throw e;
    }
  }

  async getProPlayers() {
    return this.prisma.esportPlayer.findMany({
      include: { team: true },
      take: 100,
    });
  }

  async getUpcomingMatchDays() {
    return this.prisma.esportMatchDay.findMany({
      where: { status: 'OPEN' },
      include: { matches: true },
      orderBy: { date: 'asc' },
    });
  }

  async simulateMatchIngestion(matchDayId: string) {
    // In a real scenario, we would fetch a match from Pandascore,
    // get its stats, save it in our DB, and then publish to RMQ.
    // For testing the architecture, we simulate an ingested performance for a MatchDay.
    this.logger.log(`Simulating performance ingestion for matchDay ${matchDayId}`);

    // Fetch some players to give them scores
    const players = await this.prisma.esportPlayer.findMany({ take: 5 });
    if (!players.length) return { error: 'No players in DB' };

    const performances = players.map(p => ({
      esportPlayerId: p.id,
      score: Math.floor(Math.random() * 50) + 10,
    }));

    // Send to scoring service
    this.rmqClient.emit(RABBITMQ_ROUTING_KEYS.ESPORT_PERFORMANCE_INGESTED, {
      esportMatchDayId: matchDayId,
      performances, // Sending raw performances (which could be rawStats, but for testing we just send the list to scoring)
    });

    return { message: 'Performance ingested published', performances };
  }
}
