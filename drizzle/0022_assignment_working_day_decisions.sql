CREATE TABLE IF NOT EXISTS "assignment_working_day_decisions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "assignment_id" uuid NOT NULL REFERENCES "person_project_assignments"("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "decision" text NOT NULL CHECK ("decision" IN ('habil_con_observacion', 'no_habil')),
  "observation" text,
  "created_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "assignment_working_day_decisions_assignment_date_unique"
  ON "assignment_working_day_decisions" ("assignment_id", "date");

CREATE INDEX IF NOT EXISTS "assignment_working_day_decisions_assignment_idx"
  ON "assignment_working_day_decisions" ("assignment_id");
