import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(200).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
export function pageResult<T>(items: T[], total: number, query: Pick<PaginationQuery, 'page' | 'pageSize'>): Page<T> {
  return { items, total, page: query.page, pageSize: query.pageSize };
}
export function pageResultSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({ items: z.array(itemSchema), total: z.number().int().nonnegative(), page: z.number().int().positive(), pageSize: z.number().int().positive() });
}
