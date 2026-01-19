import { HttpService } from '@nestjs/axios';
import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly httpService: HttpService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const cookieHeader = request.headers.cookie;

    if (!authHeader && !cookieHeader) {
      throw new UnauthorizedException('No authentication credentials provided');
    }

    try {
      const userServiceUrl = process.env.AUTH_URL;

      const { data } = await firstValueFrom(
        this.httpService.get(`${userServiceUrl}`, {
          headers: {
            ...(authHeader ? { Authorization: authHeader } : {}),
            ...(cookieHeader ? { Cookie: cookieHeader } : {})
          }
        })
      );

      if (!data || !data.id) {
        throw new UnauthorizedException('Invalid user information from user-service');
      }

      request.user = data;

      return true;
    } catch (error) {
      this.logger.error(
        'Error validating user with user-service:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw new UnauthorizedException('Authentication failed via user-service');
    }
  }
}
