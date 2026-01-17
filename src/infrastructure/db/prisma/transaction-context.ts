import { AsyncLocalStorage } from 'async_hooks';

import type { TransactionContext } from './types';

const transactionStorage = new AsyncLocalStorage<TransactionContext>();

export function getTransactionContext(): TransactionContext | undefined {
  return transactionStorage.getStore();
}

export function setTransactionContext(context: TransactionContext): void {
  transactionStorage.enterWith(context);
}

export function runInTransactionContext<T>(context: TransactionContext, fn: () => Promise<T>): Promise<T> {
  return transactionStorage.run(context, fn);
}

export function addSavepoint(context: TransactionContext, name: string): void {
  context.savepoints.push(name);
}

export function removeSavepoint(context: TransactionContext, name: string): void {
  const index = context.savepoints.indexOf(name);
  if (index > -1) {
    context.savepoints.splice(index, 1);
  }
}

export function getSavepoints(context: TransactionContext): string[] {
  return [...context.savepoints];
}
