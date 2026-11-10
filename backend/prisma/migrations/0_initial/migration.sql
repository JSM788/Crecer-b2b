CREATE TABLE companies (id uuid PRIMARY KEY, slug text UNIQUE NOT NULL, name text NOT NULL, time_zone text NOT NULL DEFAULT 'UTC');
CREATE TABLE users (
  id uuid PRIMARY KEY, email text UNIQUE NOT NULL, password_hash text NOT NULL,
  failures integer NOT NULL DEFAULT 0, blocked_until timestamptz
);
CREATE TABLE memberships (
  id uuid PRIMARY KEY, company_id uuid NOT NULL REFERENCES companies,
  user_id uuid NOT NULL REFERENCES users, active boolean NOT NULL DEFAULT true,
  role text NOT NULL CHECK (role IN ('commercial', 'merchandiser')),
  UNIQUE(company_id, user_id), UNIQUE(company_id, id)
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY, company_id uuid NOT NULL, membership_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  FOREIGN KEY(company_id, membership_id) REFERENCES memberships(company_id,id)
);
CREATE TABLE customers (
  id uuid PRIMARY KEY, company_id uuid NOT NULL REFERENCES companies,
  name text NOT NULL, address text NOT NULL, UNIQUE(company_id,id)
);
CREATE TABLE customer_assignments (
  company_id uuid NOT NULL, customer_id uuid NOT NULL, membership_id uuid NOT NULL,
  PRIMARY KEY(company_id,customer_id,membership_id),
  FOREIGN KEY(company_id,customer_id) REFERENCES customers(company_id,id),
  FOREIGN KEY(company_id,membership_id) REFERENCES memberships(company_id,id)
);
CREATE INDEX customers_owner ON customer_assignments(company_id,membership_id);
CREATE TABLE workdays (
  id uuid PRIMARY KEY, company_id uuid NOT NULL, membership_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed')),
  started_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz,
  business_date date NOT NULL,
  UNIQUE(company_id,id),
  UNIQUE(company_id,membership_id,business_date),
  FOREIGN KEY(company_id,membership_id) REFERENCES memberships(company_id,id),
  CHECK ((status='active' AND ended_at IS NULL) OR (status='completed' AND ended_at >= started_at))
);
CREATE UNIQUE INDEX one_active_day ON workdays(company_id,membership_id) WHERE status='active';
CREATE TABLE visits (
  id uuid PRIMARY KEY, company_id uuid NOT NULL, membership_id uuid NOT NULL,
  customer_id uuid NOT NULL, scheduled_at timestamptz NOT NULL,
  workday_id uuid, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','completed')),
  arrived_at timestamptz, ended_at timestamptz,
  result text CHECK(result IN ('attended','closed','unavailable')), observations text,
  UNIQUE(company_id,id),
  FOREIGN KEY(company_id,membership_id) REFERENCES memberships(company_id,id),
  FOREIGN KEY(company_id,customer_id) REFERENCES customers(company_id,id),
  FOREIGN KEY(company_id,workday_id) REFERENCES workdays(company_id,id),
  CHECK (
    (status='pending' AND workday_id IS NULL AND arrived_at IS NULL AND ended_at IS NULL AND result IS NULL) OR
    (status='active' AND workday_id IS NOT NULL AND arrived_at IS NOT NULL AND ended_at IS NULL AND result IS NULL) OR
    (status='completed' AND workday_id IS NOT NULL AND arrived_at IS NOT NULL AND ended_at >= arrived_at AND result IS NOT NULL)
  )
);
CREATE INDEX visits_agenda ON visits(company_id,membership_id,scheduled_at,id);
CREATE UNIQUE INDEX one_active_visit ON visits(company_id,membership_id) WHERE status='active';
CREATE TABLE operations (
  company_id uuid NOT NULL, membership_id uuid NOT NULL, key text NOT NULL,
  fingerprint text NOT NULL, response jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(company_id,membership_id,key),
  FOREIGN KEY(company_id,membership_id) REFERENCES memberships(company_id,id)
);
CREATE TABLE audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id uuid NOT NULL, membership_id uuid NOT NULL, action text NOT NULL,
  subject_id uuid NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(company_id,membership_id) REFERENCES memberships(company_id,id)
);

-- Existing visit history is preserved, including any historical duplicate slots.
-- Scheduling is serialized by the membership lock and checks occupied instants.
ALTER TABLE visits ADD CONSTRAINT visits_evidence_owner UNIQUE(company_id,membership_id,id);
CREATE TABLE visit_evidence (
  company_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  visit_id uuid NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp')),
  content bytea NOT NULL CHECK (octet_length(content) BETWEEN 1 AND 1048576),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(company_id,visit_id),
  FOREIGN KEY(company_id,membership_id,visit_id) REFERENCES visits(company_id,membership_id,id)
);
