export const errorMessages = {
  web_access_denied: 'This account is not enabled for the web application. Use the mobile application.',
  company_selection_required: 'This account has more than one company. Sign in through the company web address.',
  invitation_invalid: 'This invitation is invalid or has already been used.',
  invitation_expired: 'This invitation has expired. Request a new invitation.',
  invitation_unavailable: 'The company or user is not available for activation.',
  mail_not_configured: 'Invitation email delivery has not been configured.',
  visit_version_conflict: 'This visit has changed. Review the latest planning before saving.',
  platform_forbidden:
    'Only the global platform owner can perform this operation.',
  platform_scope_only: 'The global platform account cannot access company operations.',
  platform_company_not_found: 'The selected company was not found.',
  platform_company_suspended: 'This company is suspended. Reactivate it before changing its users.',
  platform_member_not_found:
    'The membership was not found within the selected company.',
  platform_role_in_use:
    'Remove customer assignments and finish open visits and workdays before changing this role.',
  platform_identity_exists:
    'An account already exists with this email address.',
  platform_hostname_exists: 'This hostname is already assigned or reserved.',
  platform_owner_protected:
    'A platform owner membership cannot be modified here.',
  team_forbidden: 'This membership cannot inspect the company team.',
  team_shared_identity: 'This identity belongs to more than one company. Contact the platform owner to update it.',
  field_role_required:
    'This account uses the web management application, not field execution.',
  field_management_forbidden:
    'This membership cannot manage company field operations.',
  field_member_not_found:
    'The active field member was not found within this company.',
  audit_required:
    'An exhibition audit is required for an attended Merchandiser visit.',
  invalid_audit: 'The exhibition audit contains invalid fields.',
  audit_photo_required:
    'An exhibition photograph is required for an attended Merchandiser visit.',
  audit_not_allowed:
    'Exhibition audits apply only to attended Merchandiser visits.',
  customer_management_forbidden:
    'This membership cannot manage the company customer portfolio.',
  customer_assignee_not_found:
    'The active assignee was not found within this company.',
  customer_not_found: 'A selected customer was not found within this company.',
  transaction_conflict:
    'The operation conflicted with another update. Retry the operation.',
  planning_forbidden: 'Only commercial members can plan their own visits.',
  customer_not_assigned:
    'The customer was not found within your assigned scope.',
  visit_slot_taken: 'A visit is already scheduled at this instant.',
  workday_date_completed:
    'Visits cannot be scheduled for a completed workday date.',
  customer_already_scheduled_this_week:
    'A customer cannot be scheduled more than once in the same week.',
  invalid_evidence:
    'Evidence must be a matching JPEG, PNG or WebP image of at most 1 MiB.',
  tenant_host_unknown: 'The request hostname is not assigned to a company.',
  invalid_credentials:
    'Credentials are invalid or the account is temporarily locked.',
  authentication_required: 'A valid active session is required.',
  existing_identity_password_mismatch:
    'The existing identity could not be verified.',
  invalid_time_zone: 'The company time zone is not supported.',
  idempotency_key_reused:
    'This operation key was already used with different input.',
  workday_already_started: 'A workday is already active.',
  active_workday_required: 'An active workday is required.',
  visit_not_found: 'The visit was not found within your authorized scope.',
  visit_not_pending: 'Only a pending visit can be checked into.',
  visit_scheduled_in_future:
    'This visit is scheduled for a future business date.',
  another_visit_active: 'Another visit is active. Close it before checking in.',
  visit_not_active: 'Only an active visit can be closed.',
  visits_remaining: 'Complete the visits due before closing the workday.',
  digital_disconnection_active: 'Field operations are closed after 19:00 hrs for digital disconnection.',
  outside_geofence: 'Check-in must be performed within 50 meters of the customer location.',
  storage_upload_failed: 'Failed to upload photo evidence to Cloudflare R2.',
} as const;

export type ErrorCode = keyof typeof errorMessages;

export interface FieldErrorDetail {
  path: (string | number)[];
  code: string;
  message: string;
}

/** Business/application rejection. HTTP mapping belongs to the transport adapter. */
export class ApplicationError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly details?: FieldErrorDetail[],
  ) {
    super(errorMessages[code]);
    this.name = 'ApplicationError';
  }
}

export function reject(code: ErrorCode, details?: FieldErrorDetail[]): never {
  throw new ApplicationError(code, details);
}

export function rejectField(code: ErrorCode, path: (string | number)[]): never {
  return reject(code, [{ path, code, message: errorMessages[code] }]);
}

/** Match only named database constraints; never infer fields from error text. */
export function isUniqueConstraint(
  error: unknown,
  model: string,
  fields: string[],
  index: string,
): boolean {
  if (
    typeof error !== 'object' || error === null ||
    !('code' in error) || error.code !== 'P2002'
  ) return false;
  const meta = 'meta' in error ? error.meta : undefined;
  if (typeof meta !== 'object' || meta === null) return false;
  if ('modelName' in meta && meta.modelName !== model) return false;
  const target = 'target' in meta ? meta.target : undefined;
  if (target === index) return true;
  if (
    Array.isArray(target) && 'modelName' in meta &&
    target.length === fields.length && fields.every(field => target.includes(field))
  ) return true;
  const adapter = 'driverAdapterError' in meta ? meta.driverAdapterError : undefined;
  const cause = typeof adapter === 'object' && adapter !== null && 'cause' in adapter
    ? adapter.cause : undefined;
  const constraint = typeof cause === 'object' && cause !== null && 'constraint' in cause
    ? cause.constraint : undefined;
  return typeof constraint === 'object' && constraint !== null &&
    'index' in constraint && constraint.index === index;
}
