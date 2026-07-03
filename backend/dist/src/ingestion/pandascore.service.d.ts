import { PrismaService } from '../prisma/prisma.service.js';
import { Game } from '@prisma/client';
export interface PandaScorePlayer {
    id: number;
    name: string;
    role: string | null;
    image_url: string | null;
    nationality?: string | null;
    active: boolean;
}
export interface PandaScoreTeam {
    id: number;
    name: string;
    acronym: string | null;
    image_url: string | null;
    location?: string | null;
    players?: PandaScorePlayer[];
}
export interface PandaScoreResult {
    team_id: number;
    score: number;
}
export interface PandaScoreMatch {
    id: number;
    begin_at: string;
    end_at?: string | null;
    status: string;
    match_type: string | null;
    number_of_games: number | null;
    map_picks: any | null;
    games: any;
    winner_id: number | null;
    league: {
        name: string;
    } | null;
    serie?: {
        name?: string;
        full_name?: string;
    } | null;
    tournament?: {
        id: number;
        name: string;
        tier?: string;
    } | null;
    streams_list?: Array<{
        main: boolean;
        raw_url: string;
        language: string;
    }> | null;
    opponents: Array<{
        opponent: PandaScoreTeam;
    }>;
    results: PandaScoreResult[];
}
export interface PandaScoreGamePlayer {
    player?: {
        id?: number;
    };
    stats?: Record<string, any>;
    win?: boolean;
    champion?: {
        name: string;
        image_url: string;
    };
    agent?: {
        name: string;
        image_url: string;
    };
}
export interface PandaScoreGameDetail {
    players?: PandaScoreGamePlayer[];
}
export interface PandaScoreMatchDetail {
    games?: PandaScoreGameDetail[];
}
export declare class PandaScoreService {
    private prisma;
    private readonly logger;
    private readonly baseUrl;
    constructor(prisma: PrismaService);
    private getGameSlug;
    syncUpcomingMatches(game: Game): Promise<void>;
    hasActiveMatches(game: Game): Promise<boolean>;
    syncRunningMatches(game: Game): Promise<void>;
    syncMatchPerformances(matchId: string, game: Game, matchDayId: string): Promise<void>;
    private upsertTeam;
    private fetchPlayersForTournament;
    private fetchPlayersForTeam;
}
