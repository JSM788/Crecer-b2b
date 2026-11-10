import { randomUUID } from 'node:crypto';
import { ServerResponse } from 'node:http';
import { HttpRequest } from '../types/http';
import { log } from '../logging';

export function requestContext(logging: boolean) {
  return (
    request: HttpRequest,
    response: ServerResponse,
    next: () => void,
  ): void => {
    request.requestId = randomUUID();
    response.setHeader('X-Request-Id', request.requestId);
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const started = performance.now();
    if (logging) {
      response.on('finish', () =>
        log('info', 'request_completed', {
          requestId: request.requestId,
          method: request.method,
          route: request.route?.path,
          matchedRoute: Boolean(request.route),
          status: response.statusCode,
          durationMs: Math.round(performance.now() - started),
        }),
      );
    }
    next();
  };
}
