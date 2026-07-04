// Injection tokens for the two outbound RabbitMQ clients this service needs.
// Each MUST be registered with the `queue` the real consumer listens on —
// @nestjs/microservices' RMQ ClientProxy.emit() delivers straight to that queue,
// it does not route by the event pattern/exchange unless `wildcards` is set.
export const BACKEND_ESPORT_RMQ_CLIENT = 'BACKEND_ESPORT_RMQ_CLIENT';
export const SCORING_RMQ_CLIENT = 'SCORING_RMQ_CLIENT';
