import { PandaScoreService } from './pandascore.service.js';
export declare class IngestionController {
    private pandascoreService;
    constructor(pandascoreService: PandaScoreService);
    syncMatches(): Promise<{
        success: boolean;
        message: string;
    }>;
}
