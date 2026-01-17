import { Prisma } from '@prisma/client';

import { getUserContext } from '../../../application/guards/user-context';
import type { ModelWithDeletedAt, SoftDeleteArgs, SoftDeleteManyArgs } from './types';

const SOFT_DELETE_FIELD = 'deletedAt';
const DELETED_BY_FIELD = 'deletedBy';

function hasDeletedAtField(modelName: string, dmmf: typeof Prisma.dmmf): boolean {
  const model = dmmf.datamodel.models.find(m => m.name.toLowerCase() === modelName.toLowerCase());
  return model?.fields.some(f => f.name === SOFT_DELETE_FIELD) ?? false;
}

function hasDeletedByField(modelName: string, dmmf: typeof Prisma.dmmf): boolean {
  const model = dmmf.datamodel.models.find(m => m.name.toLowerCase() === modelName.toLowerCase());
  return model?.fields.some(f => f.name === DELETED_BY_FIELD) ?? false;
}

function isDeletedAtExplicitlyFiltered(where?: Record<string, unknown>): boolean {
  if (!where) return false;
  if (SOFT_DELETE_FIELD in where) return true;

  if (where.AND) {
    const andConditions = Array.isArray(where.AND) ? where.AND : [where.AND];
    if (andConditions.some((c: unknown) => isDeletedAtExplicitlyFiltered(c as Record<string, unknown>))) {
      return true;
    }
  }

  if (where.OR) {
    const orConditions = Array.isArray(where.OR) ? where.OR : [where.OR];
    if (orConditions.some((c: unknown) => isDeletedAtExplicitlyFiltered(c as Record<string, unknown>))) {
      return true;
    }
  }

  if (where.NOT) {
    const notConditions = Array.isArray(where.NOT) ? where.NOT : [where.NOT];
    if (notConditions.some((c: unknown) => isDeletedAtExplicitlyFiltered(c as Record<string, unknown>))) {
      return true;
    }
  }

  return false;
}

function addSoftDeleteFilter<T>(args: T, modelName: string, dmmf: typeof Prisma.dmmf): T {
  const argsRecord = args as Record<string, unknown>;
  if (!hasDeletedAtField(modelName, dmmf)) {
    return args;
  }

  if (isDeletedAtExplicitlyFiltered(argsRecord?.where as Record<string, unknown>)) {
    return args;
  }

  return {
    ...args,
    where: {
      ...(argsRecord?.where as Record<string, unknown>),
      [SOFT_DELETE_FIELD]: null
    }
  };
}

export function createSoftDeleteExtension() {
  return Prisma.defineExtension({
    name: 'soft-delete',
    model: {
      $allModels: {
        softDelete<T, A extends SoftDeleteArgs>(this: T, args: A): Promise<ModelWithDeletedAt> {
          const context = Prisma.getExtensionContext(this);
          const modelName = context.$name!;

          if (!hasDeletedAtField(modelName, Prisma.dmmf)) {
            throw new Error(
              `Model ${modelName} does not have a '${SOFT_DELETE_FIELD}' field. Cannot perform soft delete.`
            );
          }

          const updateData: Record<string, unknown> = {
            [SOFT_DELETE_FIELD]: new Date()
          };

          if (hasDeletedByField(modelName, Prisma.dmmf)) {
            const userContext = getUserContext();
            updateData[DELETED_BY_FIELD] = userContext?.userId ?? null;
          }

          const modelContext = context as unknown as {
            update: (args: unknown) => Promise<ModelWithDeletedAt>;
          };

          return modelContext.update({
            where: args.where,
            data: updateData
          });
        },

        softDeleteMany<T, A extends SoftDeleteManyArgs>(this: T, args: A): Promise<{ count: number }> {
          const context = Prisma.getExtensionContext(this);
          const modelName = context.$name!;

          if (!hasDeletedAtField(modelName, Prisma.dmmf)) {
            throw new Error(
              `Model ${modelName} does not have a '${SOFT_DELETE_FIELD}' field. Cannot perform soft delete.`
            );
          }

          const updateData: Record<string, unknown> = {
            [SOFT_DELETE_FIELD]: new Date()
          };

          if (hasDeletedByField(modelName, Prisma.dmmf)) {
            const userContext = getUserContext();
            updateData[DELETED_BY_FIELD] = userContext?.userId ?? null;
          }

          const modelContext = context as unknown as {
            updateMany: (args: unknown) => Promise<{ count: number }>;
          };

          return modelContext.updateMany({
            where: args.where,
            data: updateData
          });
        },

        restore<T, A extends { where: Record<string, unknown> }>(this: T, args: A): Promise<ModelWithDeletedAt> {
          const context = Prisma.getExtensionContext(this);
          const modelName = context.$name!;

          if (!hasDeletedAtField(modelName, Prisma.dmmf)) {
            throw new Error(`Model ${modelName} does not have a '${SOFT_DELETE_FIELD}' field. Cannot restore.`);
          }

          const updateData: Record<string, unknown> = {
            [SOFT_DELETE_FIELD]: null
          };

          if (hasDeletedByField(modelName, Prisma.dmmf)) {
            updateData[DELETED_BY_FIELD] = null;
          }

          const modelContext = context as unknown as {
            update: (args: unknown) => Promise<ModelWithDeletedAt>;
          };

          return modelContext.update({
            where: args.where,
            data: updateData
          });
        },

        restoreMany<T, A extends { where: Record<string, unknown> }>(this: T, args: A): Promise<{ count: number }> {
          const context = Prisma.getExtensionContext(this);
          const modelName = context.$name!;

          if (!hasDeletedAtField(modelName, Prisma.dmmf)) {
            throw new Error(`Model ${modelName} does not have a '${SOFT_DELETE_FIELD}' field. Cannot restore.`);
          }

          const updateData: Record<string, unknown> = {
            [SOFT_DELETE_FIELD]: null
          };

          if (hasDeletedByField(modelName, Prisma.dmmf)) {
            updateData[DELETED_BY_FIELD] = null;
          }

          const modelContext = context as unknown as {
            updateMany: (args: unknown) => Promise<{ count: number }>;
          };

          return modelContext.updateMany({
            where: args.where,
            data: updateData
          });
        }
      }
    },
    query: {
      $allModels: {
        async findFirst({ model, args, query }) {
          const modifiedArgs = addSoftDeleteFilter(args, model, Prisma.dmmf);
          return query(modifiedArgs);
        },

        async findFirstOrThrow({ model, args, query }) {
          const modifiedArgs = addSoftDeleteFilter(args, model, Prisma.dmmf);
          return query(modifiedArgs);
        },

        async findMany({ model, args, query }) {
          const modifiedArgs = addSoftDeleteFilter(args, model, Prisma.dmmf);
          return query(modifiedArgs);
        },

        async findUnique({ model, args, query }) {
          const modifiedArgs = addSoftDeleteFilter(args, model, Prisma.dmmf);
          return query(modifiedArgs);
        },

        async findUniqueOrThrow({ model, args, query }) {
          const modifiedArgs = addSoftDeleteFilter(args, model, Prisma.dmmf);
          return query(modifiedArgs);
        },

        async count({ model, args, query }) {
          const modifiedArgs = addSoftDeleteFilter(args, model, Prisma.dmmf);
          return query(modifiedArgs);
        },

        async aggregate({ model, args, query }) {
          const modifiedArgs = addSoftDeleteFilter(args, model, Prisma.dmmf);
          return query(modifiedArgs);
        },

        async groupBy({ model, args, query }) {
          const modifiedArgs = addSoftDeleteFilter(args, model, Prisma.dmmf);
          return query(modifiedArgs);
        }
      }
    }
  });
}

export type SoftDeleteExtension = ReturnType<typeof createSoftDeleteExtension>;
