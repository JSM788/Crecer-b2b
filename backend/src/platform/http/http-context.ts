import { IncomingMessage, ServerResponse } from 'node:http';

export interface HttpRequest extends IncomingMessage {
  requestId: string;
  route?: { path: string };
}

/** Express response methods used only by the HTTP transport layer. */
export interface JsonResponse extends ServerResponse {
  status(code: number): JsonResponse;
  json(body: unknown): void;
}
