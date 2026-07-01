import { ProPlayersService } from './pro-players.service.js';
import { Game } from '@prisma/client';
export declare class ProPlayersController {
    private proPlayersService;
    constructor(proPlayersService: ProPlayersService);
    findAll(game?: Game, team?: string, role?: string): Promise<({
        team: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            game: import("@prisma/client").$Enums.Game;
            imageUrl: string | null;
            acronym: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        game: import("@prisma/client").$Enums.Game;
        teamId: string | null;
        role: string;
        imageUrl: string | null;
        isActive: boolean;
    })[]>;
    findByMatchDay(matchDayId: string): Promise<({
        team: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            game: import("@prisma/client").$Enums.Game;
            imageUrl: string | null;
            acronym: string | null;
        } | null;
        performances: {
            id: string;
            score: number | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        game: import("@prisma/client").$Enums.Game;
        teamId: string | null;
        role: string;
        imageUrl: string | null;
        isActive: boolean;
    })[]>;
    findOne(id: string): Promise<{
        team: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            game: import("@prisma/client").$Enums.Game;
            imageUrl: string | null;
            acronym: string | null;
        } | null;
        performances: ({
            matchDay: {
                status: import("@prisma/client").$Enums.MatchDayStatus;
                date: Date;
                game: import("@prisma/client").$Enums.Game;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            matchDayId: string;
            proPlayerId: string;
            rawStats: import("@prisma/client/runtime/client").JsonValue;
            score: number | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        game: import("@prisma/client").$Enums.Game;
        teamId: string | null;
        role: string;
        imageUrl: string | null;
        isActive: boolean;
    }>;
}
