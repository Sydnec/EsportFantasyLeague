import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_ROUTING_KEYS } from '@app/shared/rabbitmq/rabbitmq.constants';

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(@Inject('RABBITMQ_CLIENT') private readonly rmqClient: ClientProxy) {}

  calculatePointsAndPublish(payload: any) {
    this.logger.log(`Calculating points for MatchDay ${payload.esportMatchDayId}`);

    const { esportMatchDayId, performances } = payload;
    
    // Logique stateless : chaque jeu a sa formule de calcul.
    // Ici, le payload de test a déjà généré un "score", mais dans un vrai scénario
    // avec Pandascore, "performances" contiendrait "kills, deaths, assists", etc.
    // On simule l'application d'une formule ici.
    
    const calculatedPerformances = performances.map((perf: any) => {
      // Si la perf contient des stats brutes (KDA)
      if (perf.rawStats) {
        const { kills = 0, deaths = 0, assists = 0 } = perf.rawStats;
        const score = (kills * 3) + (assists * 1.5) - (deaths * 1);
        return {
          esportPlayerId: perf.esportPlayerId,
          score,
        };
      }
      
      // Fallback si on reçoit déjà un score (de la route simulate)
      return {
        esportPlayerId: perf.esportPlayerId,
        score: perf.score || 0,
      };
    });

    // Émission du résultat
    this.rmqClient.emit(RABBITMQ_ROUTING_KEYS.SCORING_POINTS_CALCULATED, {
      esportMatchDayId,
      performances: calculatedPerformances,
    });

    this.logger.log(`Published calculated points for MatchDay ${esportMatchDayId}`);
  }
}
