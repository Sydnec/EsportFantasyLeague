import { IsString } from 'class-validator';

export class JoinLeagueDto {
  @IsString()
  inviteCode!: string;
}
