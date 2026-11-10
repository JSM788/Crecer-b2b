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
