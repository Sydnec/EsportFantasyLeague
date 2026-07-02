import { PrismaService } from '../prisma/prisma.service.js';
export declare class MatchesService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        matchDay: {
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
                        location: string | null;
                    } | null;
                    id: string;
                    role: string;
                    name: string;
                    imageUrl: string | null;
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.MatchDayStatus;
            date: Date;
            game: import("@prisma/client").$Enums.Game;
            lockTime: Date;
        };
        teamA: {
            players: {
                id: string;
                role: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                game: import("@prisma/client").$Enums.Game;
                teamId: string | null;
                imageUrl: string | null;
                nationality: string | null;
                isActive: boolean;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            game: import("@prisma/client").$Enums.Game;
            imageUrl: string | null;
            acronym: string | null;
            location: string | null;
        };
        teamB: {
            players: {
                id: string;
                role: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                game: import("@prisma/client").$Enums.Game;
                teamId: string | null;
                imageUrl: string | null;
                nationality: string | null;
                isActive: boolean;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            game: import("@prisma/client").$Enums.Game;
            imageUrl: string | null;
            acronym: string | null;
            location: string | null;
        };
        winner: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            game: import("@prisma/client").$Enums.Game;
            imageUrl: string | null;
            acronym: string | null;
            location: string | null;
        } | null;
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
        streamUrl: string | null;
        matchType: string | null;
        numberOfGames: number | null;
        finishedAt: Date | null;
    }>;
}
