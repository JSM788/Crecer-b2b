import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { HttpRequest } from './http-context';
import { operationKeySchema } from './request.schemas';

export const OperationKey = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest<HttpRequest>();
  return operationKeySchema.parse(request.headers['idempotency-key']);
});
