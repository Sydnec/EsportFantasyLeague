import { PrismaService } from '../prisma/prisma.service.js';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(userId: string, action: string, entityType: string, entityId: string, payload: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
    }>;
    findByEntity(entityType: string, entityId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
    }[]>;
    findByUser(userId: string, take?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
    }[]>;
}
