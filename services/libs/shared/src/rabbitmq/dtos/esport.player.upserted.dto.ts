import { IsString, IsBoolean, IsUrl, IsOptional } from 'class-validator';

export class EsportPlayerUpsertedDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  esportTeamId: string;

  @IsString()
  game: string;

  @IsString()
  role: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  isActive: boolean;
}
