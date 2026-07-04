import { IsString, IsDateString } from 'class-validator';

export class EsportMatchDayUpsertedDto {
  @IsString()
  id: string;

  @IsDateString()
  date: string;

  @IsString()
  game: string;

  @IsDateString()
  lockTime: string;

  @IsString()
  status: string;
}
