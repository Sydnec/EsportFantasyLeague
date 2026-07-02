import { PrismaService } from '../prisma/prisma.service.js';
type DevQueryParams = {
    take?: string;
    skip?: string;
    where?: string;
    orderBy?: string;
};
export declare class DevToolsService {
    private readonly prisma;
    private readonly models;
    constructor(prisma: PrismaService);
    getModelsOverview(): Promise<{
        name: string;
        tableName: string;
        count: any;
        fields: Record<string, unknown>[];
    }[]>;
    getModelSchema(modelName: string): {
        name: string;
        tableName: string;
        fields: Record<string, unknown>[];
    };
    runQuery(sql?: string): Promise<unknown>;
    findMany(modelName: string, params: DevQueryParams): any;
    findOne(modelName: string, id: string): any;
    create(modelName: string, payload: Record<string, unknown>): any;
    update(modelName: string, id: string, payload: Record<string, unknown>): any;
    remove(modelName: string, id: string): any;
    private getModel;
    private getDelegate;
    private normalizePayload;
    private coerceScalarValue;
    private describeField;
    private parseJson;
    private parseNumber;
    private toDelegateName;
}
export {};
