import { IsString, IsArray, ArrayMinSize } from 'class-validator';

export class CreateRosterDto {
  @IsString()
  leagueId!: string;

  @IsString()
  matchDayId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  proPlayerIds!: string[];
}
