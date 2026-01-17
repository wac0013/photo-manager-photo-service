import { PrismaService } from './prisma.service';
import { getTransactionContext, runInTransactionContext } from './transaction-context';
import type { TransactionIsolationLevel, TransactionalOptions } from './types';

const DEFAULT_OPTIONS: Required<Omit<TransactionalOptions, 'isolationLevel'>> = {
  timeout: 30000,
  maxWait: 2000,
  requiredNew: false
};

const DEFAULT_ISOLATION_LEVEL: TransactionIsolationLevel = 'ReadCommitted';

export function Transactional(options: TransactionalOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const {
      isolationLevel = DEFAULT_ISOLATION_LEVEL,
      timeout = DEFAULT_OPTIONS.timeout,
      maxWait = DEFAULT_OPTIONS.maxWait,
      requiredNew = DEFAULT_OPTIONS.requiredNew
    } = options;

    descriptor.value = async function (this: any, ...args: any[]) {
      const prismaService = this.prisma || this._prisma || this.prismaService || this._prismaService;

      if (!prismaService || !(prismaService instanceof PrismaService)) {
        throw new Error(
          'PrismaService não encontrado. Certifique-se de que o serviço possui PrismaService injetado como "prisma", "_prisma", "prismaService" ou "_prismaService".'
        );
      }

      const currentContext = getTransactionContext();

      if (currentContext && !requiredNew) {
        return originalMethod.apply(this, args);
      }

      const transactionOptions = {
        isolationLevel,
        maxWait,
        timeout
      };

      const result = await (prismaService as any).$transaction(async (tx: any) => {
        const newContext = {
          transaction: tx,
          level: currentContext ? currentContext.level + 1 : 0,
          isolationLevel,
          timeout,
          savepoints: []
        };

        return runInTransactionContext(newContext, async () => {
          return await originalMethod.apply(this, args);
        });
      }, transactionOptions);

      return result;
    };

    return descriptor;
  };
}
