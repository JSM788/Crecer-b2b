import {
  applyDecorators,
  Get,
  HttpCode,
  Post,
  SetMetadata,
} from '@nestjs/common';
import { z } from 'zod';

export const ENDPOINT_METADATA = 'field:endpoint';
export interface EndpointDefinition {
  method: 'get' | 'post';
  path?: string;
  input?: z.ZodType;
  query?: z.ZodType;
  output: z.ZodType;
  public?: boolean;
  operationKey?: boolean;
}

export function Endpoint(definition: EndpointDefinition): MethodDecorator {
  const route =
    definition.method === 'get'
      ? Get(definition.path ?? '')
      : Post(definition.path ?? '');
  return applyDecorators(
    route,
    HttpCode(200),
    SetMetadata(ENDPOINT_METADATA, definition),
  );
}
