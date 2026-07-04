import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

export interface RabbitMQModuleOptions {
  name: string; // The token used to inject the client (e.g. 'RABBITMQ_CLIENT')
  urls: string[]; // e.g. ['amqp://localhost:5672']
  queue: string; // the specific queue name if needed
}

@Module({})
export class RabbitMQModule {
  static register({ name, urls, queue }: RabbitMQModuleOptions): DynamicModule {
    return {
      module: RabbitMQModule,
      imports: [
        ClientsModule.register([
          {
            name,
            transport: Transport.RMQ,
            options: {
              urls,
              queue,
              queueOptions: {
                durable: true,
              },
            },
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
