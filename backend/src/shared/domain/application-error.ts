export const errorMessages = {
  planning_forbidden: 'Only commercial members can plan their own visits.',
  customer_not_assigned: 'The customer was not found within your assigned scope.',
  visit_slot_taken: 'A visit is already scheduled at this instant.',
  workday_date_completed: 'Visits cannot be scheduled for a completed workday date.',
  invalid_evidence: 'Evidence must be a matching JPEG, PNG or WebP image of at most 1 MiB.',
  tenant_host_unknown: 'The request hostname is not assigned to a company.',
  invalid_credentials: 'Credentials are invalid or the account is temporarily locked.',
  authentication_required: 'A valid active session is required.',
  existing_identity_password_mismatch: 'The existing identity could not be verified.',
  invalid_time_zone: 'The company time zone is not supported.',
  idempotency_key_reused: 'This operation key was already used with different input.',
  workday_already_started: 'A workday is already active.',
  active_workday_required: 'An active workday is required.',
  visit_not_found: 'The visit was not found within your authorized scope.',
  visit_not_pending: 'Only a pending visit can be checked into.',
  visit_scheduled_in_future: 'This visit is scheduled for a future business date.',
  another_visit_active: 'Another visit is active. Close it before checking in.',
  visit_not_active: 'Only an active visit can be closed.',
  visits_remaining: 'Complete the visits due before closing the workday.',
} as const;

export type ErrorCode = keyof typeof errorMessages;

/** Business/application rejection. HTTP mapping belongs to the transport adapter. */
export class ApplicationError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(errorMessages[code]);
    this.name = 'ApplicationError';
  }
}

export function reject(code: ErrorCode): never {
  throw new ApplicationError(code);
}
