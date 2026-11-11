import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ZodError } from 'zod';
import {
  ApplicationError,
  ErrorCode,
  errorMessages,
  isUniqueConstraint,
} from '../errors/application-error';
import { errorMetadata, log } from '../logging';
import { HttpRequest, JsonResponse } from '../types/http';

const businessStatus: Record<ErrorCode, number> = {
  web_access_denied: 403,
  company_selection_required: 409,
  invitation_invalid: 400,
  invitation_expired: 410,
  invitation_unavailable: 409,
  mail_not_configured: 503,
  visit_version_conflict: 409,
  platform_forbidden: 403,
  platform_scope_only: 403,
  platform_company_not_found: 404,
  platform_company_suspended: 409,
  platform_member_not_found: 404,
  platform_role_in_use: 409,
  platform_identity_exists: 409,
  platform_hostname_exists: 409,
  platform_owner_protected: 409,
  team_forbidden: 403,
  team_shared_identity: 409,
  field_role_required: 403,
  field_management_forbidden: 403,
  field_member_not_found: 404,
  audit_required: 400,
  invalid_audit: 400,
  audit_photo_required: 400,
  audit_not_allowed: 400,
  customer_management_forbidden: 403,
  customer_assignee_not_found: 404,
  customer_not_found: 404,
  transaction_conflict: 409,
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
  digital_disconnection_active: 409,
  storage_upload_failed: 502,
};

function postgresCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error))
    return undefined;
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
        ...(error.details ? { details: error.details } : {}),
      });
      return;
    }
    if (error instanceof ZodError) {
      const invalidEvidence = error.issues.some(
        (issue) => issue.path[0] === 'attachment',
      );
      const invalidAudit = error.issues.some(
        (issue) => issue.path[0] === 'audit',
      );
      response.status(400).json({
        code: invalidEvidence
          ? 'invalid_evidence'
          : invalidAudit
            ? 'invalid_audit'
            : 'invalid_request',
        message: invalidEvidence
          ? errorMessages.invalid_evidence
          : invalidAudit
            ? errorMessages.invalid_audit
            : 'The request contains invalid fields.',
        requestId: request.requestId,
        details: error.issues.map((issue) => ({
          path: issue.path,
          code: issue.code,
          message: issue.message,
        })),
      });
      return;
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      error.status === 413
    ) {
      response.status(413).json({
        code: 'payload_too_large',
        message: 'The request exceeds the bounded JSON body limit.',
        requestId: request.requestId,
      });
      return;
    }
    if (postgresCode(error) === 'P2002') {
      response.status(409).json({
        code: 'conflict',
        message: 'The operation conflicts with the current record state.',
        requestId: request.requestId,
        ...(isUniqueConstraint(error, 'Customer', ['companyId', 'ruc'], 'customers_company_ruc')
          ? { details: [{ path: ['ruc'], code: 'duplicate', message: 'A customer already exists with this RUC.' }] }
          : {}),
      });
      return;
    }
    if (error instanceof HttpException && error.getStatus() < 500) {
      const status = error.getStatus();
      response.status(status).json({
        code: status === 404 ? 'route_not_found' : 'invalid_request',
        message: 'The HTTP request could not be accepted.',
        requestId: request.requestId,
      });
      return;
    }
    log('error', 'request_failed', {
      requestId: request.requestId,
      ...errorMetadata(error),
    });
    response.status(500).json({
      code: 'internal_error',
      message: 'Unexpected server error. Contact support with the request ID.',
      requestId: request.requestId,
    });
  }
}
