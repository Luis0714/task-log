CREATE TABLE IF NOT EXISTS "project_team_news_stories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" text NOT NULL,
  "team_id" text,
  "work_item_id" integer NOT NULL,
  "work_item_title_snapshot" text,
  "linked_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "linked_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "project_team_news_stories_unique_link"
  ON "project_team_news_stories" ("project_id", COALESCE("team_id", ''), "work_item_id");

CREATE INDEX IF NOT EXISTS "project_team_news_stories_project_idx"
  ON "project_team_news_stories" ("project_id");

CREATE INDEX IF NOT EXISTS "project_team_news_stories_team_idx"
  ON "project_team_news_stories" ("team_id");
