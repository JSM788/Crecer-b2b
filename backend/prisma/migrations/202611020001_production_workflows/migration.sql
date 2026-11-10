-- Execution snapshots remain NULL for legacy rows: the original role is unknown.
ALTER TABLE companies ADD COLUMN created_at timestamptz(6) NOT NULL DEFAULT now();
ALTER TABLE memberships ADD COLUMN created_at timestamptz(6) NOT NULL DEFAULT now();
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE workdays ADD COLUMN role text CHECK(role IS NULL OR role IN ('commercial','merchandiser'));
ALTER TABLE visits
  ADD COLUMN planned_role text CHECK(planned_role IS NULL OR planned_role IN ('commercial','merchandiser')),
  ADD COLUMN execution_role text CHECK(execution_role IS NULL OR execution_role IN ('commercial','merchandiser')),
  ADD COLUMN version integer NOT NULL DEFAULT 0 CHECK(version >= 0),
  ADD COLUMN cancelled_at timestamptz(6),
  ADD COLUMN cancellation_reason text;
ALTER TABLE visits DROP CONSTRAINT visits_status_check;
ALTER TABLE visits DROP CONSTRAINT visits_check;
ALTER TABLE visits ADD CONSTRAINT visits_status_check CHECK(status IN ('pending','active','completed','cancelled'));
ALTER TABLE visits ADD CONSTRAINT visits_check CHECK (
  (status='pending' AND arrived_at IS NULL AND ended_at IS NULL AND result IS NULL AND cancelled_at IS NULL) OR
  (status='active' AND workday_id IS NOT NULL AND arrived_at IS NOT NULL AND ended_at IS NULL AND result IS NULL AND cancelled_at IS NULL) OR
  (status='completed' AND workday_id IS NOT NULL AND arrived_at IS NOT NULL AND ended_at >= arrived_at AND result IS NOT NULL AND cancelled_at IS NULL) OR
  (status='cancelled' AND workday_id IS NULL AND arrived_at IS NULL AND ended_at IS NULL AND result IS NULL AND cancelled_at IS NOT NULL)
);
CREATE TABLE membership_role_history (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  previous_role text NOT NULL CHECK(previous_role IN ('commercial','merchandiser','manager')),
  role text NOT NULL CHECK(role IN ('commercial','merchandiser','manager')),
  changed_at timestamptz(6) NOT NULL DEFAULT now(),
  changed_by_user_id uuid NOT NULL REFERENCES users(id),
  FOREIGN KEY(company_id,membership_id) REFERENCES memberships(company_id,id)
);
CREATE INDEX membership_role_history_company_id_membership_id_changed_at_idx ON membership_role_history(company_id,membership_id,changed_at);
CREATE TABLE invitations (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  membership_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  token_ciphertext text,
  expires_at timestamptz(6) NOT NULL,
  consumed_at timestamptz(6),
  revoked_at timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  FOREIGN KEY(company_id,membership_id) REFERENCES memberships(company_id,id),
  CHECK(consumed_at IS NULL OR revoked_at IS NULL)
);
CREATE INDEX invitations_company_id_membership_id_created_at_idx ON invitations(company_id,membership_id,created_at);
CREATE TABLE mail_outbox (
  id uuid PRIMARY KEY,
  invitation_id uuid NOT NULL UNIQUE REFERENCES invitations(id),
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  next_attempt_at timestamptz(6) NOT NULL DEFAULT now(),
  locked_until timestamptz(6),
  claim_token text,
  last_error text,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  sent_at timestamptz(6)
);
CREATE INDEX mail_outbox_status_next_attempt_at_idx ON mail_outbox(status,next_attempt_at);
CREATE INDEX companies_created_at_id_idx ON companies(created_at DESC,id);
CREATE INDEX memberships_company_id_created_at_id_idx ON memberships(company_id,created_at DESC,id);
