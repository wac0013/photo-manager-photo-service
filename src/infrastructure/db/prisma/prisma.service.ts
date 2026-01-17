import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import 'dotenv/config';
import { Pool } from 'pg';

import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';

import { createAuditExtension } from './audit.extension';
import { createSoftDeleteExtension } from './soft-delete.extension';
import { addSavepoint, getTransactionContext, removeSavepoint } from './transaction-context';
import type { TransactionClient } from './types';

function getPrismaLogConfig(): Prisma.LogLevel[] {
  if (process.env.LOG_DATABASE === 'true') {
    return ['query', 'info', 'warn', 'error'];
  }
  return ['warn', 'error'];
}

export function createExtendedPrismaClient() {
  const connectionString = process.env.DATABASE_URL as string;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({
    adapter,
    log: getPrismaLogConfig()
  });
  return prisma.$extends(createSoftDeleteExtension()).$extends(createAuditExtension());
}

export type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly _client: ExtendedPrismaClient;
  private readonly logger: Logger = new Logger(PrismaService.name);

  constructor() {
    this._client = createExtendedPrismaClient();
  }

  get client(): ExtendedPrismaClient {
    return this._client;
  }

  async onModuleInit() {
    await this._client.$connect();
  }

  async onModuleDestroy() {
    await this._client.$disconnect();
  }

  getCurrentTransaction(): TransactionClient | ExtendedPrismaClient {
    const context = getTransactionContext();
    return (context?.transaction as TransactionClient) || this._client;
  }

  private _sanitizeSavepointName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  async commit(): Promise<void> {
    const context = getTransactionContext();
    if (!context) {
      this.logger.warn('Não há transação ativa. Use @Transactional() para criar uma transação.');
      return;
    }

    if (context.level === 0 && context.savepoints.length === 0) {
      throw new Error(
        'Não é possível fazer commit manualmente na transação raiz. O commit é automático ao finalizar a função com sucesso.'
      );
    }

    if (context.savepoints.length > 0) {
      const savepointName = context.savepoints[context.savepoints.length - 1];
      const sanitizedName = this._sanitizeSavepointName(savepointName);
      const tx = context.transaction as unknown as {
        $executeRawUnsafe: (query: string) => Promise<void>;
      };
      await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${sanitizedName}`);
      removeSavepoint(context, savepointName);
    }
  }

  async rollback(): Promise<void> {
    const context = getTransactionContext();
    if (!context) {
      this.logger.warn('Não há transação ativa. Use @Transactional() para criar uma transação.');
      return;
    }

    if (context.level === 0 && context.savepoints.length === 0) {
      throw new Error(
        'Não é possível fazer rollback manualmente na transação raiz. O rollback é automático quando uma exceção é lançada.'
      );
    }

    if (context.savepoints.length > 0) {
      const savepointName = context.savepoints[context.savepoints.length - 1];
      const sanitizedName = this._sanitizeSavepointName(savepointName);
      const tx = context.transaction as unknown as {
        $executeRawUnsafe: (query: string) => Promise<void>;
      };
      await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${sanitizedName}`);
      removeSavepoint(context, savepointName);
    } else {
      throw new Error('Não há savepoint ativo para fazer rollback. Use createSavepoint() antes de chamar rollback().');
    }
  }

  async createSavepoint(name?: string): Promise<string> {
    const context = getTransactionContext();
    if (!context) {
      throw new Error('Não há transação ativa. Use @Transactional() para criar uma transação.');
    }

    const savepointName = name || `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sanitizedName = this._sanitizeSavepointName(savepointName);
    const tx = context.transaction as unknown as {
      $executeRawUnsafe: (query: string) => Promise<void>;
    };
    await tx.$executeRawUnsafe(`SAVEPOINT ${sanitizedName}`);
    addSavepoint(context, sanitizedName);
    return sanitizedName;
  }

  $transaction<T>(
    fn: (tx: TransactionClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number; isolationLevel?: string }
  ): Promise<T> {
    const client = this._client as unknown as {
      $transaction: (
        fn: (tx: TransactionClient) => Promise<T>,
        options?: {
          maxWait?: number;
          timeout?: number;
          isolationLevel?: string;
        }
      ) => Promise<T>;
    };
    return client.$transaction(fn, options);
  }
}
