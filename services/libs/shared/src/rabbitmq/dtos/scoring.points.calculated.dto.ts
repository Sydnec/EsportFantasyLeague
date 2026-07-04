import { IsString, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class PlayerScoreDto {
  @IsString()
  esportPlayerId: string;

  @IsNumber()
  score: number;
}

export class ScoringPointsCalculatedDto {
  @IsString()
  esportMatchDayId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerScoreDto)
  performances: PlayerScoreDto[];
}
