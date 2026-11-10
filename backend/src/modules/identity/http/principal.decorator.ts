import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from './session.guard';
import { Principal } from '../domain/principal';

export const CurrentPrincipal = createParamDecorator((_data: unknown, context: ExecutionContext): Principal => {
  return context.switchToHttp().getRequest<AuthenticatedRequest>().principal;
});
