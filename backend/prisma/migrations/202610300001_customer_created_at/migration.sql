ALTER TABLE customers
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX customers_company_id_created_at_idx
  ON customers(company_id, created_at);
