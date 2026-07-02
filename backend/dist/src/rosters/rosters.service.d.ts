import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RosterValidationService } from './roster-validation.service.js';
import { CreateRosterDto } from './dto/create-roster.dto.js';
import { UpdateRosterDto } from './dto/update-roster.dto.js';
export declare class RostersService {
    private prisma;
    private auditService;
    private validationService;
    constructor(prisma: PrismaService, auditService: AuditService, validationService: RosterValidationService);
    create(userId: string, dto: CreateRosterDto): Promise<{
        matchDay: {
            status: import("@prisma/client").$Enums.MatchDayStatus;
            date: Date;
            game: import("@prisma/client").$Enums.Game;
            lockTime: Date;
        };
        picks: ({
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
            };
        } & {
            id: string;
            createdAt: Date;
            proPlayerId: string;
            rosterId: string;
            pickOrder: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        leagueId: string;
        totalScore: number | null;
        matchDayId: string;
        status: import("@prisma/client").$Enums.RosterStatus;
    }>;
    update(userId: string, rosterId: string, dto: UpdateRosterDto): Promise<{
        matchDay: {
            status: import("@prisma/client").$Enums.MatchDayStatus;
            date: Date;
            game: import("@prisma/client").$Enums.Game;
            lockTime: Date;
        };
        picks: ({
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
            };
        } & {
            id: string;
            createdAt: Date;
            proPlayerId: string;
            rosterId: string;
            pickOrder: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        leagueId: string;
        totalScore: number | null;
        matchDayId: string;
        status: import("@prisma/client").$Enums.RosterStatus;
    }>;
    findUserRosters(userId: string, leagueId?: string): Promise<({
        league: {
            id: string;
            name: string;
        };
        matchDay: {
            id: string;
            status: import("@prisma/client").$Enums.MatchDayStatus;
            date: Date;
            game: import("@prisma/client").$Enums.Game;
            lockTime: Date;
        };
        picks: ({
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
            proPlayerId: string;
            rosterId: string;
            pickOrder: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        leagueId: string;
        totalScore: number | null;
        matchDayId: string;
        status: import("@prisma/client").$Enums.RosterStatus;
    })[]>;
    findById(rosterId: string, userId: string): Promise<{
        user: {
            username: string;
            id: string;
        };
        league: {
            id: string;
            name: string;
            games: import("@prisma/client").$Enums.Game[];
            tournaments: string[];
        };
        matchDay: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.MatchDayStatus;
            date: Date;
            game: import("@prisma/client").$Enums.Game;
            lockTime: Date;
        };
        picks: ({
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
            proPlayerId: string;
            rosterId: string;
            pickOrder: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        leagueId: string;
        totalScore: number | null;
        matchDayId: string;
        status: import("@prisma/client").$Enums.RosterStatus;
    }>;
    findLeagueRostersForMatchDay(leagueId: string, matchDayId: string, userId: string): Promise<({
        user: {
            username: string;
            id: string;
            avatarUrl: string | null;
        };
        picks: ({
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
            };
        } & {
            id: string;
            createdAt: Date;
            proPlayerId: string;
            rosterId: string;
            pickOrder: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        leagueId: string;
        totalScore: number | null;
        matchDayId: string;
        status: import("@prisma/client").$Enums.RosterStatus;
    })[]>;
}
