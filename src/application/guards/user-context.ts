import { AsyncLocalStorage } from 'async_hooks';

export interface UserContext {
  userId: string;
}

const userStorage = new AsyncLocalStorage<UserContext>();

export function getUserContext(): UserContext | undefined {
  return userStorage.getStore();
}

export function setUserContext(context: UserContext): void {
  userStorage.enterWith(context);
}

export function runWithUserContext<T>(context: UserContext, fn: () => T): T {
  return userStorage.run(context, fn);
}
