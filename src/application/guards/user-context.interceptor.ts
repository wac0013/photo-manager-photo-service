import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';

import { Observable } from 'rxjs';

import { UserContext, runWithUserContext } from './user-context';

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      return next.handle();
    }

    const userContext: UserContext = { userId: user.id };

    return new Observable(subscriber => {
      runWithUserContext(userContext, () => {
        next.handle().subscribe({
          next: value => subscriber.next(value),
          error: err => subscriber.error(err),
          complete: () => subscriber.complete()
        });
      });
    });
  }
}
