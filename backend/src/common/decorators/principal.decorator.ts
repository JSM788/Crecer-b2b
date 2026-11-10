import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Principal } from '../types/principal';

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Principal => {
    return context.switchToHttp().getRequest().principal;
  },
);
