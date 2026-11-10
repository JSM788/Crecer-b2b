ALTER TABLE users ADD COLUMN display_name text;
ALTER TABLE users ADD COLUMN is_platform_owner boolean NOT NULL DEFAULT false;
ALTER TABLE memberships DROP CONSTRAINT memberships_role_check;
ALTER TABLE memberships ADD CONSTRAINT memberships_role_check CHECK (role IN ('commercial', 'merchandiser', 'manager'));

CREATE TABLE company_domains (
  hostname text PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  CONSTRAINT company_domains_hostname_normalized CHECK (hostname = lower(hostname) AND length(hostname) BETWEEN 1 AND 253)
);
CREATE INDEX company_domains_company_id_idx ON company_domains(company_id);

CREATE TABLE platform_audit_log (
  id uuid PRIMARY KEY,
  actor_user_id uuid NOT NULL REFERENCES users(id),
  company_id uuid NOT NULL REFERENCES companies(id),
  subject_id uuid NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX platform_audit_log_company_id_created_at_idx ON platform_audit_log(company_id,created_at);
