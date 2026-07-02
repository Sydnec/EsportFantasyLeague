import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { DevToolsService } from './dev-tools.service.js';

@Controller('dev/db')
export class DevToolsController {
  constructor(private readonly devToolsService: DevToolsService) {}

  private assertLocalAccess(request: Request) {
    const expectedToken = process.env.DEV_DASHBOARD_TOKEN || 'local-dev-dashboard';
    const remoteAddress = request.socket.remoteAddress ?? '';
    const isLoopback =
      remoteAddress === '127.0.0.1' ||
      remoteAddress === '::1' ||
      remoteAddress === '::ffff:127.0.0.1';
    const proxyToken = request.header('x-dev-dashboard-token');

    if (isLoopback || proxyToken === expectedToken) {
      return;
    }

    throw new UnauthorizedException('Dev tools are restricted to local dashboard access');
  }

  @Get('models')
  getModels(@Req() request: Request) {
    this.assertLocalAccess(request);
    return this.devToolsService.getModelsOverview();
  }

  @Get('models/:model')
  getModelSchema(@Req() request: Request, @Param('model') model: string) {
    this.assertLocalAccess(request);
    return this.devToolsService.getModelSchema(model);
  }

  @Post('query')
  runQuery(@Req() request: Request, @Body() body: { sql?: string }) {
    this.assertLocalAccess(request);
    return this.devToolsService.runQuery(body.sql);
  }

  @Get(':model')
  findMany(
    @Req() request: Request,
    @Param('model') model: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('where') where?: string,
    @Query('orderBy') orderBy?: string,
  ) {
    this.assertLocalAccess(request);
    return this.devToolsService.findMany(model, {
      take,
      skip,
      where,
      orderBy,
    });
  }

  @Get(':model/:id')
  findOne(@Req() request: Request, @Param('model') model: string, @Param('id') id: string) {
    this.assertLocalAccess(request);
    return this.devToolsService.findOne(model, id);
  }

  @Post(':model')
  create(
    @Req() request: Request,
    @Param('model') model: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertLocalAccess(request);
    return this.devToolsService.create(model, body);
  }

  @Patch(':model/:id')
  update(
    @Req() request: Request,
    @Param('model') model: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertLocalAccess(request);
    return this.devToolsService.update(model, id, body);
  }

  @Delete(':model/:id')
  remove(@Req() request: Request, @Param('model') model: string, @Param('id') id: string) {
    this.assertLocalAccess(request);
    return this.devToolsService.remove(model, id);
  }
}