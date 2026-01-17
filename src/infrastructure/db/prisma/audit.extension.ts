import { Prisma } from '@prisma/client';

import { getUserContext } from '../../../application/guards/user-context';

const CREATED_BY_FIELD = 'createdBy';
const UPDATED_BY_FIELD = 'updatedBy';

function getAuditValue(data: Record<string, unknown>, field: string, fallback: string): string {
  const value = data[field];
  return typeof value === 'string' ? value : fallback;
}

export function createAuditExtension() {
  return Prisma.defineExtension({
    name: 'audit',
    query: {
      $allModels: {
        async create({ args, query }) {
          const context = getUserContext();
          if (context) {
            const data = args.data as Record<string, unknown>;
            (args.data as Record<string, unknown>) = {
              ...data,
              [CREATED_BY_FIELD]: getAuditValue(data, CREATED_BY_FIELD, context.userId),
              [UPDATED_BY_FIELD]: getAuditValue(data, UPDATED_BY_FIELD, context.userId)
            };
          }
          return query(args);
        },
        async createMany({ args, query }) {
          const context = getUserContext();
          if (context) {
            if (Array.isArray(args.data)) {
              (args.data as Record<string, unknown>[]) = args.data.map(item => {
                const data = item as Record<string, unknown>;
                return {
                  ...data,
                  [CREATED_BY_FIELD]: getAuditValue(data, CREATED_BY_FIELD, context.userId),
                  [UPDATED_BY_FIELD]: getAuditValue(data, UPDATED_BY_FIELD, context.userId)
                };
              });
            } else {
              const data = args.data as Record<string, unknown>;
              (args.data as Record<string, unknown>) = {
                ...data,
                [CREATED_BY_FIELD]: getAuditValue(data, CREATED_BY_FIELD, context.userId),
                [UPDATED_BY_FIELD]: getAuditValue(data, UPDATED_BY_FIELD, context.userId)
              };
            }
          }
          return query(args);
        },
        async update({ args, query }) {
          const context = getUserContext();
          if (context) {
            const data = args.data as Record<string, unknown>;
            (args.data as Record<string, unknown>) = {
              ...data,
              [UPDATED_BY_FIELD]: getAuditValue(data, UPDATED_BY_FIELD, context.userId)
            };
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          const context = getUserContext();
          if (context) {
            const data = args.data as Record<string, unknown>;
            (args.data as Record<string, unknown>) = {
              ...data,
              [UPDATED_BY_FIELD]: getAuditValue(data, UPDATED_BY_FIELD, context.userId)
            };
          }
          return query(args);
        },
        async upsert({ args, query }) {
          const context = getUserContext();
          if (context) {
            const createData = args.create as Record<string, unknown>;
            const updateData = args.update as Record<string, unknown>;
            (args.create as Record<string, unknown>) = {
              ...createData,
              [CREATED_BY_FIELD]: getAuditValue(createData, CREATED_BY_FIELD, context.userId),
              [UPDATED_BY_FIELD]: getAuditValue(createData, UPDATED_BY_FIELD, context.userId)
            };
            (args.update as Record<string, unknown>) = {
              ...updateData,
              [UPDATED_BY_FIELD]: getAuditValue(updateData, UPDATED_BY_FIELD, context.userId)
            };
          }
          return query(args);
        }
      }
    }
  });
}
