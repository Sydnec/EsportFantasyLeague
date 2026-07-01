import { PrismaService } from '../prisma/prisma.service.js';
export declare class RosterValidationService {
    private prisma;
    constructor(prisma: PrismaService);
    validate(userId: string, leagueId: string, matchDayId: string, proPlayerIds: string[]): Promise<void>;
}
