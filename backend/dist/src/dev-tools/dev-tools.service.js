var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
let DevToolsService = class DevToolsService {
    prisma;
    models = Prisma.dmmf.datamodel.models;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getModelsOverview() {
        return Promise.all(this.models.map(async (model) => ({
            name: model.name,
            tableName: model.dbName ?? model.name,
            count: await this.getDelegate(model.name).count(),
            fields: model.fields.map((field) => this.describeField(field)),
        })));
    }
    getModelSchema(modelName) {
        const model = this.getModel(modelName);
        return {
            name: model.name,
            tableName: model.dbName ?? model.name,
            fields: model.fields.map((field) => this.describeField(field)),
        };
    }
    async runQuery(sql) {
        if (!sql || sql.trim() === '') {
            throw new BadRequestException('SQL query is required');
        }
        if (process.env.DEV_DASHBOARD_ALLOW_SQL !== 'true') {
            throw new BadRequestException('Raw SQL is disabled. Set DEV_DASHBOARD_ALLOW_SQL=true to enable it locally.');
        }
        return this.prisma.$queryRawUnsafe(sql);
    }
    findMany(modelName, params) {
        const delegate = this.getDelegate(modelName);
        const take = this.parseNumber(params.take, 50);
        const skip = this.parseNumber(params.skip, 0);
        return delegate.findMany({
            take,
            skip,
            where: this.parseJson(params.where),
            orderBy: this.parseJson(params.orderBy),
        });
    }
    findOne(modelName, id) {
        const model = this.getModel(modelName);
        const idField = model.fields.find((field) => field.isId);
        if (!idField) {
            throw new BadRequestException(`Model ${model.name} does not expose an id field`);
        }
        return this.getDelegate(modelName).findUnique({
            where: {
                [idField.name]: this.coerceScalarValue(idField, id),
            },
        });
    }
    create(modelName, payload) {
        const model = this.getModel(modelName);
        return this.getDelegate(model.name).create({
            data: this.normalizePayload(model.name, payload, 'create'),
        });
    }
    update(modelName, id, payload) {
        const model = this.getModel(modelName);
        const idField = model.fields.find((field) => field.isId);
        if (!idField) {
            throw new BadRequestException(`Model ${model.name} does not expose an id field`);
        }
        return this.getDelegate(model.name).update({
            where: {
                [idField.name]: this.coerceScalarValue(idField, id),
            },
            data: this.normalizePayload(model.name, payload, 'update'),
        });
    }
    remove(modelName, id) {
        const model = this.getModel(modelName);
        const idField = model.fields.find((field) => field.isId);
        if (!idField) {
            throw new BadRequestException(`Model ${model.name} does not expose an id field`);
        }
        return this.getDelegate(model.name).delete({
            where: {
                [idField.name]: this.coerceScalarValue(idField, id),
            },
        });
    }
    getModel(modelName) {
        const model = this.models.find((entry) => entry.name.toLowerCase() === modelName.toLowerCase());
        if (!model) {
            throw new NotFoundException(`Unknown model ${modelName}`);
        }
        return model;
    }
    getDelegate(modelName) {
        const delegateName = this.toDelegateName(this.getModel(modelName).name);
        const delegate = this.prisma[delegateName];
        if (!delegate) {
            throw new NotFoundException(`Model delegate ${delegateName} is unavailable`);
        }
        return delegate;
    }
    normalizePayload(modelName, payload, mode) {
        const model = this.getModel(modelName);
        const allowedFields = new Map(model.fields
            .filter((field) => field.kind === 'scalar' || field.kind === 'enum')
            .map((field) => [field.name, field]));
        return Object.entries(payload).reduce((accumulator, [key, value]) => {
            const field = allowedFields.get(key);
            if (!field || field.isReadOnly || field.isUpdatedAt) {
                return accumulator;
            }
            if (mode === 'update' && field.isId) {
                return accumulator;
            }
            accumulator[key] = this.coerceScalarValue(field, value);
            return accumulator;
        }, {});
    }
    coerceScalarValue(field, value) {
        if (value === null || value === undefined) {
            return value;
        }
        if (field.isList && Array.isArray(value)) {
            return value.map((item) => this.coerceScalarValue({ ...field, isList: false }, item));
        }
        if (field.type === 'DateTime' && typeof value === 'string') {
            return new Date(value);
        }
        if ((field.type === 'Int' || field.type === 'BigInt') && typeof value === 'string' && value.trim() !== '') {
            return field.type === 'BigInt' ? BigInt(value) : Number.parseInt(value, 10);
        }
        if (field.type === 'Float' && typeof value === 'string' && value.trim() !== '') {
            return Number.parseFloat(value);
        }
        if (field.type === 'Boolean' && typeof value === 'string') {
            return value === 'true';
        }
        return value;
    }
    describeField(field) {
        return {
            name: field.name,
            type: field.type,
            kind: field.kind,
            isList: field.isList,
            isRequired: field.isRequired,
            isId: field.isId,
            isUnique: field.isUnique,
            isUpdatedAt: field.isUpdatedAt,
            hasDefaultValue: field.hasDefaultValue,
        };
    }
    parseJson(value) {
        if (!value) {
            return undefined;
        }
        try {
            return JSON.parse(value);
        }
        catch {
            throw new BadRequestException('Invalid JSON parameter');
        }
    }
    parseNumber(value, fallback) {
        if (!value) {
            return fallback;
        }
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? fallback : parsed;
    }
    toDelegateName(modelName) {
        return modelName.slice(0, 1).toLowerCase() + modelName.slice(1);
    }
};
DevToolsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], DevToolsService);
export { DevToolsService };
//# sourceMappingURL=dev-tools.service.js.map