import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';

/**
 * Allows the request without a Bearer token. If a token is present, it must be valid
 * (otherwise 401). Use for routes where anonymous access is allowed but admins may
 * send JWT for extended behavior.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      return Promise.resolve(true);
    }
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest<TUser>(
    err: Error | undefined,
    user: TUser | false,
    _info: unknown,
    context: ExecutionContext,
  ): TUser | undefined {
    if (err) {
      throw err;
    }
    if (!user) {
      const req = context.switchToHttp().getRequest();
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      if (token) {
        throw new UnauthorizedException();
      }
    }
    return user ? (user as TUser) : undefined;
  }
}
