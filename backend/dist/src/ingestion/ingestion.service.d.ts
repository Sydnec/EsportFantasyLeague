import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ScoringService } from '../scoring/scoring.service.js';
import { PandaScoreService } from './pandascore.service.js';
export declare class IngestionService implements OnModuleInit {
    private prisma;
    private scoringService;
    private pandaScoreService;
    private readonly logger;
    private lastSyncTimes;
    constructor(prisma: PrismaService, scoringService: ScoringService, pandaScoreService: PandaScoreService);
    onModuleInit(): Promise<void>;
    syncPandaScoreMatches(): Promise<void>;
    syncLiveMatchScores(): Promise<void>;
    processLockedMatchDays(): Promise<void>;
    private finalizeMatchDay;
}
