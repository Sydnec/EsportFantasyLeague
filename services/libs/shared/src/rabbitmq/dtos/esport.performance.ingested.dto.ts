import { IsString, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class PlayerRawStatsDto {
  @IsString()
  esportPlayerId: string;

  @IsObject()
  rawStats: Record<string, any>;
}

export class EsportPerformanceIngestedDto {
  @IsString()
  esportMatchDayId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerRawStatsDto)
  performances: PlayerRawStatsDto[];
}
