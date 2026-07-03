DO $$ BEGIN
  CREATE TYPE "project_config_source" AS ENUM ('auto', 'manual');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "project_configurations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization" text NOT NULL,
  "project" text NOT NULL,
  "working_date_field" text,
  "timezone" text,
  "completed_work_field" text,
  "original_estimate_field" text,
  "activity_field" text,
  "task_work_item_type" text,
  "bug_work_item_type" text,
  "backlog_item_type" text,
  "task_todo_state" text,
  "task_done_state" text,
  "config_source" "project_config_source" NOT NULL DEFAULT 'auto',
  "discovered_at" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "project_configurations_org_project_unique"
  ON "project_configurations" ("organization", "project");
