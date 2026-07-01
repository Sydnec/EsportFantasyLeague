import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLeagueDto } from './dto/create-league.dto.js';
export declare class LeaguesService {
    private prisma;
    constructor(prisma: PrismaService);
    getUpcomingTournaments(): Promise<Record<string, string[]>>;
    create(userId: string, dto: CreateLeagueDto): Promise<{
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
    findUserLeagues(userId: string): Promise<({
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
    findById(leagueId: string, userId: string): Promise<{
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
    join(userId: string, inviteCode: string): Promise<{
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
    getLeaderboard(leagueId: string, userId: string): Promise<{
        user: {
            username: string;
            id: string;
            avatarUrl: string | null;
        };
        id: string;
        totalScore: number;
    }[]>;
    remove(userId: string, leagueId: string): Promise<{
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
