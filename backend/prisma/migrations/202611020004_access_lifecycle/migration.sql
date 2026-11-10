ALTER TABLE users
  ADD COLUMN activated_at timestamptz(6),
  ADD COLUMN password_changed_at timestamptz(6);
ALTER TABLE invitations ADD COLUMN purpose text NOT NULL DEFAULT 'activation'
  CHECK(purpose IN ('activation','password_reset'));
-- Only confirmed consumed invitations establish historical activation dates.
-- Accounts provisioned without this evidence retain an unknown activation date.
UPDATE users u SET activated_at = facts.activated_at
FROM (
  SELECT m.user_id, min(i.consumed_at) AS activated_at
  FROM invitations i JOIN memberships m ON m.id=i.membership_id AND m.company_id=i.company_id
  WHERE i.consumed_at IS NOT NULL GROUP BY m.user_id
) facts WHERE u.id=facts.user_id;
CREATE TABLE access_events (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  company_id uuid REFERENCES companies(id),
  membership_id uuid,
  invitation_id uuid REFERENCES invitations(id),
  actor_user_id uuid REFERENCES users(id),
  event text NOT NULL,
  outcome text,
  occurred_at timestamptz(6) NOT NULL DEFAULT now(),
  details jsonb,
  FOREIGN KEY(company_id,membership_id) REFERENCES memberships(company_id,id),
  CHECK(membership_id IS NULL OR company_id IS NOT NULL)
);
CREATE INDEX access_events_company_id_membership_id_occurred_at_id_idx ON access_events(company_id,membership_id,occurred_at,id);
CREATE INDEX access_events_invitation_id_occurred_at_idx ON access_events(invitation_id,occurred_at);
