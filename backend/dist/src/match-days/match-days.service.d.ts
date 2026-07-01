import { PrismaService } from '../prisma/prisma.service.js';
import { Game, MatchDayStatus } from '@prisma/client';
export declare class MatchDaysService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(filters?: {
        game?: Game;
        status?: MatchDayStatus;
        date?: string;
    }): Promise<({
        _count: {
            rosters: number;
            performances: number;
        };
        matches: ({
            teamA: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                game: import("@prisma/client").$Enums.Game;
                imageUrl: string | null;
                acronym: string | null;
            };
            teamB: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                game: import("@prisma/client").$Enums.Game;
                imageUrl: string | null;
                acronym: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            games: import("@prisma/client/runtime/client").JsonValue | null;
            matchDayId: string;
            teamAId: string;
            teamBId: string;
            winnerId: string | null;
            scheduledAt: Date;
            status: string;
            teamAScore: number | null;
            teamBScore: number | null;
            tournamentName: string | null;
            finishedAt: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.MatchDayStatus;
        date: Date;
        game: import("@prisma/client").$Enums.Game;
        lockTime: Date;
    })[]>;
    findById(id: string): Promise<{
        matches: ({
            teamA: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                game: import("@prisma/client").$Enums.Game;
                imageUrl: string | null;
                acronym: string | null;
            };
            teamB: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                game: import("@prisma/client").$Enums.Game;
                imageUrl: string | null;
                acronym: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            games: import("@prisma/client/runtime/client").JsonValue | null;
            matchDayId: string;
            teamAId: string;
            teamBId: string;
            winnerId: string | null;
            scheduledAt: Date;
            status: string;
            teamAScore: number | null;
            teamBScore: number | null;
            tournamentName: string | null;
            finishedAt: Date | null;
        })[];
        performances: ({
            proPlayer: {
                team: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    game: import("@prisma/client").$Enums.Game;
                    imageUrl: string | null;
                    acronym: string | null;
                } | null;
                id: string;
                role: string;
                name: string;
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
        status: import("@prisma/client").$Enums.MatchDayStatus;
        date: Date;
        game: import("@prisma/client").$Enums.Game;
        lockTime: Date;
    }>;
    autoLockMatchDays(): Promise<void>;
}
