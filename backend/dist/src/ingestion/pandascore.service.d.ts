import { PrismaService } from '../prisma/prisma.service.js';
import { Game } from '@prisma/client';
export interface PandaScorePlayer {
    id: number;
    name: string;
    role: string | null;
    image_url: string | null;
    active: boolean;
}
export interface PandaScoreTeam {
    id: number;
    name: string;
    acronym: string | null;
    image_url: string | null;
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
    games: number;
    winner_id: number | null;
    league: {
        name: string;
    } | null;
    opponents: Array<{
        opponent: PandaScoreTeam;
    }>;
    results: PandaScoreResult[];
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
    private upsertTeam;
}
