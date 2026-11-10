import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { ZodError } from 'zod';
import { ApplicationError, ErrorCode, errorMessages } from '../../shared/domain/application-error';
import { errorMetadata, log } from '../logging';
import { HttpRequest, JsonResponse } from './http-context';

const businessStatus: Record<ErrorCode, number> = {
  planning_forbidden: 403,
  customer_not_assigned: 404,
  visit_slot_taken: 409,
  workday_date_completed: 409,
  invalid_evidence: 400,
  tenant_host_unknown: 400,
  invalid_credentials: 401,
  authentication_required: 401,
  existing_identity_password_mismatch: 409,
  invalid_time_zone: 400,
  idempotency_key_reused: 409,
  workday_already_started: 409,
  active_workday_required: 409,
  visit_not_found: 404,
  visit_not_pending: 409,
  visit_scheduled_in_future: 409,
  another_visit_active: 409,
  visit_not_active: 409,
  visits_remaining: 409,
};

function postgresCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
  return typeof error.code === 'string' ? error.code : undefined;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<HttpRequest>();
    const response = host.switchToHttp().getResponse<JsonResponse>();
    if (error instanceof ApplicationError) {
      response.status(businessStatus[error.code]).json({
        code: error.code,
        message: error.message,
        requestId: request.requestId,
      });
      return;
    }
    if (error instanceof ZodError) {
      const invalidEvidence = error.issues.some(issue => issue.path[0] === 'attachment');
      response.status(400).json({
        code: invalidEvidence ? 'invalid_evidence' : 'invalid_request',
        message: invalidEvidence ? errorMessages.invalid_evidence : 'The request contains invalid fields.',
        requestId: request.requestId,
        details: error.issues.map(issue => ({ path: issue.path, message: issue.message })),
      });
      return;
    }
    if (typeof error === 'object' && error !== null && 'status' in error && error.status === 413) {
      response.status(413).json({ code: 'payload_too_large', message: 'The request exceeds the bounded JSON body limit.', requestId: request.requestId });
      return;
    }
    if (postgresCode(error) === '23505') {
      response.status(409).json({ code: 'conflict', message: 'The operation conflicts with the current record state.', requestId: request.requestId });
      return;
    }
    if (error instanceof HttpException && error.getStatus() < 500) {
      const status = error.getStatus();
      response.status(status).json({ code: status === 404 ? 'route_not_found' : 'invalid_request', message: 'The HTTP request could not be accepted.', requestId: request.requestId });
      return;
    }
    log('error', 'request_failed', { requestId: request.requestId, ...errorMetadata(error) });
    response.status(500).json({ code: 'internal_error', message: 'Unexpected server error. Contact support with the request ID.', requestId: request.requestId });
  }
}
