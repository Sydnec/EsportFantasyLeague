import { LeaguesService } from './leagues.service.js';
import { CreateLeagueDto } from './dto/create-league.dto.js';
import { JoinLeagueDto } from './dto/join-league.dto.js';
import { JwtPayload } from '../common/decorators/current-user.decorator.js';
export declare class LeaguesController {
    private leaguesService;
    constructor(leaguesService: LeaguesService);
    create(user: JwtPayload, dto: CreateLeagueDto): Promise<{
        members: {
            id: string;
            userId: string;
            leagueId: string;
            totalScore: number;
            joinedAt: Date;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        games: import("@prisma/client").$Enums.Game[];
        tournaments: string[];
        rosterSize: number;
        cooldownDays: number;
        inviteCode: string;
        maxMembers: number;
        createdById: string;
        onlyCreatorInvites: boolean;
    }>;
    findAll(user: JwtPayload): Promise<({
        _count: {
            members: number;
        };
        members: {
            user: {
                username: string;
                id: string;
                avatarUrl: string | null;
            };
            id: string;
            totalScore: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        games: import("@prisma/client").$Enums.Game[];
        tournaments: string[];
        rosterSize: number;
        cooldownDays: number;
        inviteCode: string;
        maxMembers: number;
        createdById: string;
        onlyCreatorInvites: boolean;
    })[]>;
    getUpcomingTournaments(): Promise<Record<string, string[]>>;
    findOne(id: string): Promise<{
        members: {
            user: {
                username: string;
                id: string;
                avatarUrl: string | null;
            };
            id: string;
            totalScore: number;
            joinedAt: Date;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        games: import("@prisma/client").$Enums.Game[];
        tournaments: string[];
        rosterSize: number;
        cooldownDays: number;
        inviteCode: string;
        maxMembers: number;
        createdById: string;
        onlyCreatorInvites: boolean;
    }>;
    join(user: JwtPayload, dto: JoinLeagueDto): Promise<{
        members: {
            user: {
                username: string;
                id: string;
                avatarUrl: string | null;
            };
            id: string;
            totalScore: number;
            joinedAt: Date;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        games: import("@prisma/client").$Enums.Game[];
        tournaments: string[];
        rosterSize: number;
        cooldownDays: number;
        inviteCode: string;
        maxMembers: number;
        createdById: string;
        onlyCreatorInvites: boolean;
    }>;
    leaderboard(id: string): Promise<{
        user: {
            username: string;
            id: string;
            avatarUrl: string | null;
        };
        id: string;
        totalScore: number;
    }[]>;
    remove(user: JwtPayload, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        games: import("@prisma/client").$Enums.Game[];
        tournaments: string[];
        rosterSize: number;
        cooldownDays: number;
        inviteCode: string;
        maxMembers: number;
        createdById: string;
        onlyCreatorInvites: boolean;
    }>;
}
