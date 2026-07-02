import { Module } from '@nestjs/common';
import { DevToolsController } from './dev-tools.controller.js';
import { DevToolsService } from './dev-tools.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [DevToolsController],
  providers: [DevToolsService],
})
export class DevToolsModule {}