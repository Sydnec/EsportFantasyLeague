import { PrismaService } from '../prisma/prisma.service.js';
import { Game } from '@prisma/client';
export declare class ProPlayersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(filters?: {
        game?: Game;
        team?: string;
        role?: string;
    }): Promise<({
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
        role: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        game: import("@prisma/client").$Enums.Game;
        teamId: string | null;
        imageUrl: string | null;
        isActive: boolean;
    })[]>;
    findById(id: string): Promise<{
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
        role: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        game: import("@prisma/client").$Enums.Game;
        teamId: string | null;
        imageUrl: string | null;
        isActive: boolean;
    }>;
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
        role: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        game: import("@prisma/client").$Enums.Game;
        teamId: string | null;
        imageUrl: string | null;
        isActive: boolean;
    })[]>;
}
