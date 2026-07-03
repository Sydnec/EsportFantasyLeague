export const RABBITMQ_EXCHANGE = 'esfl.topic';

export const RABBITMQ_ROUTING_KEYS = {
  ESPORT_PLAYER_UPSERTED: 'esport.player.upserted',
  ESPORT_PERFORMANCE_INGESTED: 'esport.performance.ingested',
  SCORING_POINTS_CALCULATED: 'scoring.points.calculated',
};

export const RABBITMQ_QUEUES = {
  SCORING_SERVICE_QUEUE: 'scoring-service-queue',
  BACKEND_SERVICE_SCORING_QUEUE: 'backend-service-scoring-queue',
  BACKEND_SERVICE_ESPORT_QUEUE: 'backend-service-esport-queue',
};
