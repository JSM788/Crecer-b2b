import { Injectable } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { PATH_METADATA } from '@nestjs/common/constants';
import { z } from 'zod';
import {
  ENDPOINT_METADATA,
  EndpointDefinition,
} from '../../../common/decorators/endpoint.decorator';

function content(schema: z.ZodType, input = false) {
  return {
    'application/json': {
      schema: z.toJSONSchema(schema, input ? { io: 'input' } : {}),
    },
  };
}

@Injectable()
export class ApiDocumentService {
  constructor(private readonly modules: ModulesContainer) {}

  document() {
    const paths: Record<string, Record<string, unknown>> = {};
    const errorSchema = z.object({
      code: z.string(),
      message: z.string(),
      requestId: z.string(),
      details: z.array(z.unknown()).optional(),
    });
    const errorResponse = {
      description:
        'Request rejected. Stable machine code; rejected transitions do not change business data.',
      content: content(errorSchema),
    };
    for (const module of this.modules.values()) {
      for (const wrapper of module.controllers.values()) {
        const controller = wrapper.metatype;
        if (!controller) continue;
        const prefix = Reflect.getMetadata(PATH_METADATA, controller) as string;
        for (const name of Object.getOwnPropertyNames(controller.prototype)) {
          if (name === 'constructor') continue;
          const endpoint = Reflect.getMetadata(
            ENDPOINT_METADATA,
            controller.prototype[name],
          ) as EndpointDefinition | undefined;
          if (!endpoint) continue;
          const path = ('/' + prefix + '/' + (endpoint.path ?? ''))
            .replace(/\/$/, '')
            .replace(/:([a-zA-Z]+)/g, '{$1}');
          const parameters: Record<string, unknown>[] = [];
          if (endpoint.query) {
            const query = z.toJSONSchema(endpoint.query, { io: 'input' });
            for (const [name, schema] of Object.entries(
              query.properties ?? {},
            )) {
              parameters.push({
                name,
                in: 'query',
                required: query.required?.includes(name) ?? false,
                schema,
              });
            }
          }
          if (path !== '/v1/health' && !path.startsWith('/v1/invitations/'))
            parameters.push({
              name: 'X-Tenant-Host',
              in: 'header',
              required: false,
              description: 'Optional company web domain. When provided, the authenticated membership must belong to this company. Native clients derive company scope from their session.',
              schema: { type: 'string', maxLength: 253 },
            });
          for (const parameter of path.matchAll(/\{([a-zA-Z]+)\}/g))
            parameters.push({
              name: parameter[1],
              in: 'path',
              required: true,
              schema: parameter[1] === 'token'
                ? { type: 'string', minLength: 40, maxLength: 128 }
                : { type: 'string', format: 'uuid' },
            });
          if (endpoint.operationKey)
            parameters.push({
              name: 'Idempotency-Key',
              in: 'header',
              required: true,
              schema: {
                type: 'string',
                minLength: 1,
                maxLength: 128,
                pattern: '^[A-Za-z0-9_.:-]+$',
              },
            });
          paths[path] ??= {};
          paths[path][endpoint.method] = {
            operationId:
              endpoint.method +
              '_' +
              path.replace(/^\/v1/, '').replace(/[^a-z0-9]/gi, '_'),
            security: endpoint.public ? [] : [{ bearerAuth: [] }],
            parameters,
            ...(endpoint.input
              ? {
                  requestBody: {
                    required: true,
                    content: content(endpoint.input, true),
                  },
                }
              : {}),
            responses: {
              '200': {
                description: 'Success',
                content: content(endpoint.output),
              },
              '400': errorResponse,
              '401': errorResponse,
              '403': errorResponse,
              '404': errorResponse,
              '409': errorResponse,
              '413': errorResponse,
              '500': errorResponse,
            },
          };
        }
      }
    }
    return {
      openapi: '3.1.0',
      info: {
        title: 'Field Operations API',
        version: '0.1.0',
        description:
          'Company-isolated customer management and personal field operations. Lists capped at 200 records. Financial condition and purchase dates are unavailable.',
      },
      paths: Object.fromEntries(
        Object.entries(paths).sort(([a], [b]) => a.localeCompare(b)),
      ),
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } },
      },
    };
  }
}
