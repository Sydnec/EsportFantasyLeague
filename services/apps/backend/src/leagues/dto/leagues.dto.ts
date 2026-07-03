import { Game } from '@prisma/client-backend';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateLeagueDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @IsEnum(Game, { each: true })
  games!: Game[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tournaments?: string[];

  @IsInt()
  @Min(1)
  @Max(10)
  rosterSize!: number;

  @IsInt()
  @Min(0)
  cooldownDays!: number;

  @IsOptional()
  @IsBoolean()
  onlyCreatorInvites?: boolean;
}

export class JoinLeagueDto {
  @IsString()
  @IsNotEmpty()
  inviteCode!: string;
}
