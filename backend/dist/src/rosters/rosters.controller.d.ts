import { RostersService } from './rosters.service.js';
import { CreateRosterDto } from './dto/create-roster.dto.js';
import { UpdateRosterDto } from './dto/update-roster.dto.js';
import { JwtPayload } from '../common/decorators/current-user.decorator.js';
export declare class RostersController {
    private rostersService;
    constructor(rostersService: RostersService);
    create(user: JwtPayload, dto: CreateRosterDto): Promise<{
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
    findAll(user: JwtPayload, leagueId?: string): Promise<({
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
    findByLeagueAndMatchDay(user: JwtPayload, leagueId: string, matchDayId: string): Promise<({
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
    findOne(user: JwtPayload, id: string): Promise<{
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
    update(user: JwtPayload, id: string, dto: UpdateRosterDto): Promise<{
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
}
