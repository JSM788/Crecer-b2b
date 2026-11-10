ALTER TABLE memberships ADD COLUMN can_manage_customers boolean NOT NULL DEFAULT false;
ALTER TABLE memberships ADD COLUMN transition_version integer NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN ruc text CHECK (ruc IS NULL OR ruc ~ '^[0-9]{11}$');
ALTER TABLE customers ADD COLUMN district text;
ALTER TABLE customers ADD COLUMN zone text;
ALTER TABLE customers ADD COLUMN assignment_version integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX customers_company_ruc ON customers(company_id,ruc);
