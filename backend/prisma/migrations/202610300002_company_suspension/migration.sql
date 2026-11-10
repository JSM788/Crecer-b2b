ALTER TABLE companies
  ADD COLUMN status text NOT NULL DEFAULT 'active',
  ADD COLUMN suspended_at timestamptz,
  ADD CONSTRAINT companies_status_check CHECK (status IN ('active', 'suspended'));

ALTER TABLE users ADD COLUMN platform_version integer NOT NULL DEFAULT 0;

CREATE TABLE platform_sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX platform_sessions_user_id_idx ON platform_sessions(user_id);

CREATE TABLE platform_operations (
  actor_user_id uuid NOT NULL REFERENCES users(id),
  key text NOT NULL,
  fingerprint text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (actor_user_id, key)
);

-- Preserve existing global-owner browser sessions during the scope migration.
INSERT INTO platform_sessions(token_hash, user_id, expires_at)
SELECT s.token_hash, m.user_id, s.expires_at
FROM sessions s
JOIN memberships m ON m.id = s.membership_id AND m.company_id = s.company_id
JOIN users u ON u.id = m.user_id
WHERE u.is_platform_owner = true;

DELETE FROM sessions s
USING memberships m, users u
WHERE m.id = s.membership_id AND m.company_id = s.company_id
  AND u.id = m.user_id AND u.is_platform_owner = true;
