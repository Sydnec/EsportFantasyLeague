import { Controller, Get } from '@nestjs/common';
import { EsportAdapterService } from './esport-adapter.service';

@Controller()
export class EsportAdapterController {
  constructor(private readonly esportAdapterService: EsportAdapterService) {}

  @Get()
  getHello(): string {
    return this.esportAdapterService.getHello();
  }
}
