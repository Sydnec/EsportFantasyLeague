import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsArray,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Game } from '@prisma/client';

export class CreateLeagueDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name!: string;

  @IsArray()
  @IsEnum(Game, { each: true })
  games!: Game[];

  @IsArray()
  @IsString({ each: true })
  tournaments!: string[];

  @IsInt()
  @Min(1)
  @Max(10)
  rosterSize!: number;

  @IsInt()
  @Min(1)
  @Max(30)
  cooldownDays!: number;

  @IsOptional()
  @IsBoolean()
  onlyCreatorInvites?: boolean;
}
