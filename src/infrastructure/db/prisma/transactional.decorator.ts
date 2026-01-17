import { Logger } from '@nestjs/common';

import { getPrismaServiceInstance } from './prisma.context';
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
    const logger = new Logger(Transactional.name);

    descriptor.value = async function (this: any, ...args: any[]) {
      const prismaService = getPrismaServiceInstance();

      if (!prismaService) {
        logger.error(
          'PrismaService não encontrado. Certifique-se de que o PrismaModule foi inicializado antes de usar @Transactional().'
        );
        return originalMethod.apply(this, args) as unknown as Promise<unknown>;
      }

      const currentContext = getTransactionContext();

      if (currentContext && !requiredNew) {
        return originalMethod.apply(this, args) as unknown as Promise<unknown>;
      }

      const transactionOptions = {
        isolationLevel,
        maxWait,
        timeout
      };

      const result = await prismaService.$transaction(async (tx: any) => {
        const newContext = {
          transaction: tx,
          level: currentContext ? currentContext.level + 1 : 0,
          isolationLevel,
          timeout,
          savepoints: []
        };

        return runInTransactionContext(newContext, () => {
          return originalMethod.apply(this, args) as unknown as Promise<unknown>;
        });
      }, transactionOptions);

      return result;
    };

    return descriptor;
  };
}
