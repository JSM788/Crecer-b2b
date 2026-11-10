import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { z } from 'zod';

const operationKeySchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_.:-]+$/);
export const OperationKey = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    return operationKeySchema.parse(
      context.switchToHttp().getRequest().headers['idempotency-key'],
    );
  },
);
