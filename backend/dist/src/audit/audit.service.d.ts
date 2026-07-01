import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(userId: string, action: string, entityType: string, entityId: string, payload: Prisma.InputJsonValue): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        payload: Prisma.JsonValue;
    }>;
    findByEntity(entityType: string, entityId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        payload: Prisma.JsonValue;
    }[]>;
    findByUser(userId: string, take?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        payload: Prisma.JsonValue;
    }[]>;
}
