ALTER TABLE memberships ADD COLUMN can_manage_field_operations boolean NOT NULL DEFAULT false;
ALTER TABLE visits ADD COLUMN audit jsonb;
