import { IsString, IsObject } from 'class-validator';

export class EsportPerformanceIngestedDto {
  @IsString()
  esportMatchDayId: string;

  @IsString()
  esportPlayerId: string;

  @IsObject()
  rawStats: Record<string, any>;
}
