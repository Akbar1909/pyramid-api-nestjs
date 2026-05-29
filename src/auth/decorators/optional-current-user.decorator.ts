import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

/** Use with `OptionalJwtAuthGuard` when `user` may be absent. */
export const OptionalCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    return ctx.switchToHttp().getRequest().user as User | undefined;
  },
);
