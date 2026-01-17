export type TransactionIsolationLevel = 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';

export type TransactionClient = {
  [K in string]: any;
};

export type TransactionalOptions = {
  isolationLevel?: TransactionIsolationLevel;
  timeout?: number;
  maxWait?: number;
  requiredNew?: boolean;
};

export type TransactionContext = {
  transaction: TransactionClient;
  level: number;
  isolationLevel?: TransactionIsolationLevel;
  timeout?: number;
  savepoints: string[];
};

export type ModelWithDeletedAt = {
  deletedAt?: Date | null;
};

export type SoftDeleteArgs = {
  where: Record<string, any>;
  deletedBy?: string;
};

export type SoftDeleteManyArgs = {
  where: Record<string, any>;
  deletedBy?: string;
};
