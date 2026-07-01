import { Game } from '@prisma/client';
export declare class CreateLeagueDto {
    name: string;
    games: Game[];
    tournaments: string[];
    rosterSize: number;
    cooldownDays: number;
    onlyCreatorInvites?: boolean;
}
