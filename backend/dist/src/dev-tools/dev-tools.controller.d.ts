import type { Request } from 'express';
import { DevToolsService } from './dev-tools.service.js';
export declare class DevToolsController {
    private readonly devToolsService;
    constructor(devToolsService: DevToolsService);
    private assertLocalAccess;
    getModels(request: Request): Promise<{
        name: string;
        tableName: string;
        count: any;
        fields: Record<string, unknown>[];
    }[]>;
    getModelSchema(request: Request, model: string): {
        name: string;
        tableName: string;
        fields: Record<string, unknown>[];
    };
    runQuery(request: Request, body: {
        sql?: string;
    }): Promise<unknown>;
    findMany(request: Request, model: string, take?: string, skip?: string, where?: string, orderBy?: string): any;
    findOne(request: Request, model: string, id: string): any;
    create(request: Request, model: string, body: Record<string, unknown>): any;
    update(request: Request, model: string, id: string, body: Record<string, unknown>): any;
    remove(request: Request, model: string, id: string): any;
}
