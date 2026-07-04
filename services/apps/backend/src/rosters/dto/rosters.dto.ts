import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateRosterDto {
  @IsString()
  @IsNotEmpty()
  leagueId!: string;

  @IsString()
  @IsNotEmpty()
  matchDayId!: string;

  @IsArray()
  @IsString({ each: true })
  proPlayerIds!: string[];
}

export class UpdateRosterPicksDto {
  @IsArray()
  @IsString({ each: true })
  proPlayerIds!: string[];
}
