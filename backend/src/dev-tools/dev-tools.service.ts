import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type DevQueryParams = {
  take?: string;
  skip?: string;
  where?: string;
  orderBy?: string;
};

@Injectable()
export class DevToolsService {
  private readonly models = Prisma.dmmf.datamodel.models;

  constructor(private readonly prisma: PrismaService) {}

  async getModelsOverview() {
    return Promise.all(
      this.models.map(async (model) => ({
        name: model.name,
        tableName: model.dbName ?? model.name,
        count: await this.getDelegate(model.name).count(),
        fields: model.fields.map((field) => this.describeField(field)),
      })),
    );
  }

  getModelSchema(modelName: string) {
    const model = this.getModel(modelName);
    return {
      name: model.name,
      tableName: model.dbName ?? model.name,
      fields: model.fields.map((field) => this.describeField(field)),
    };
  }

  async runQuery(sql?: string) {
    if (!sql || sql.trim() === '') {
      throw new BadRequestException('SQL query is required');
    }

    if (process.env.DEV_DASHBOARD_ALLOW_SQL !== 'true') {
      throw new BadRequestException(
        'Raw SQL is disabled. Set DEV_DASHBOARD_ALLOW_SQL=true to enable it locally.',
      );
    }

    return this.prisma.$queryRawUnsafe(sql);
  }

  findMany(modelName: string, params: DevQueryParams) {
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

  findOne(modelName: string, id: string) {
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

  create(modelName: string, payload: Record<string, unknown>) {
    const model = this.getModel(modelName);
    return this.getDelegate(model.name).create({
      data: this.normalizePayload(model.name, payload, 'create'),
    });
  }

  update(modelName: string, id: string, payload: Record<string, unknown>) {
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

  remove(modelName: string, id: string) {
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

  private getModel(modelName: string) {
    const model = this.models.find((entry) => entry.name.toLowerCase() === modelName.toLowerCase());

    if (!model) {
      throw new NotFoundException(`Unknown model ${modelName}`);
    }

    return model;
  }

  private getDelegate(modelName: string) {
    const delegateName = this.toDelegateName(this.getModel(modelName).name);
    const delegate = (this.prisma as Record<string, any>)[delegateName];

    if (!delegate) {
      throw new NotFoundException(`Model delegate ${delegateName} is unavailable`);
    }

    return delegate;
  }

  private normalizePayload(
    modelName: string,
    payload: Record<string, unknown>,
    mode: 'create' | 'update',
  ) {
    const model = this.getModel(modelName);
    const allowedFields = new Map(
      model.fields
        .filter((field) => field.kind === 'scalar' || field.kind === 'enum')
        .map((field) => [field.name, field]),
    );

    return Object.entries(payload).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
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

  private coerceScalarValue(field: any, value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (field.isList && Array.isArray(value)) {
      return value.map((item: unknown): unknown =>
        this.coerceScalarValue({ ...field, isList: false }, item),
      );
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

  private describeField(field: any): Record<string, unknown> {
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

  private parseJson(value?: string) {
    if (!value) {
      return undefined;
    }

    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException('Invalid JSON parameter');
    }
  }

  private parseNumber(value: string | undefined, fallback: number) {
    if (!value) {
      return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  private toDelegateName(modelName: string) {
    return modelName.slice(0, 1).toLowerCase() + modelName.slice(1);
  }
}