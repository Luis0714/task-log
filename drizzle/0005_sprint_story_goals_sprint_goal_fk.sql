ALTER TABLE "sprint_story_goals" ADD COLUMN "sprint_goal_id" uuid;--> statement-breakpoint
INSERT INTO "sprint_goals" ("organization", "project", "team", "sprint_path", "general_objective")
SELECT DISTINCT
  "organization",
  "project",
  "team",
  "sprint_path",
  NULL
FROM "sprint_story_goals"
ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "sprint_story_goals" AS "story_goal"
SET "sprint_goal_id" = "parent"."id"
FROM "sprint_goals" AS "parent"
WHERE "parent"."organization" = "story_goal"."organization"
  AND "parent"."project" = "story_goal"."project"
  AND "parent"."team" = "story_goal"."team"
  AND "parent"."sprint_path" = "story_goal"."sprint_path";--> statement-breakpoint
ALTER TABLE "sprint_story_goals" ALTER COLUMN "sprint_goal_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sprint_story_goals" ADD CONSTRAINT "sprint_story_goals_sprint_goal_id_sprint_goals_id_fk" FOREIGN KEY ("sprint_goal_id") REFERENCES "public"."sprint_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP INDEX "sprint_story_goals_scope_work_item_unique";--> statement-breakpoint
ALTER TABLE "sprint_story_goals" DROP COLUMN "organization";--> statement-breakpoint
ALTER TABLE "sprint_story_goals" DROP COLUMN "project";--> statement-breakpoint
ALTER TABLE "sprint_story_goals" DROP COLUMN "team";--> statement-breakpoint
ALTER TABLE "sprint_story_goals" DROP COLUMN "sprint_path";--> statement-breakpoint
CREATE UNIQUE INDEX "sprint_story_goals_sprint_goal_work_item_unique" ON "sprint_story_goals" USING btree ("sprint_goal_id","work_item_id");
