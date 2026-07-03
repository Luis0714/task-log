ALTER TABLE "project_configurations"
  ADD COLUMN IF NOT EXISTS "responsable_fields" jsonb
  DEFAULT '[]'::jsonb
  NOT NULL;