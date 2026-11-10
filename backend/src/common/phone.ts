import { z } from 'zod';

export const phoneSchema = z.string().trim().max(40)
  .transform(value => value.replace(/[\s()-]/g, ''))
  .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, 'Use an international phone number with country code.'));
