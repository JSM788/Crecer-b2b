import { z } from 'zod';

export const emptyBodySchema = z.object({}).strict();
export const operationKeySchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_.:-]+$/);
