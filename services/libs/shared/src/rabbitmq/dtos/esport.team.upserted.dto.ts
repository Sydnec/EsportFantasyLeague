import { IsString, IsUrl, IsOptional } from 'class-validator';

export class EsportTeamUpsertedDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  acronym?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  game: string;
}
