ALTER TABLE "sprint_story_goals" ADD COLUMN "sprint_goal_id" uuid;--> statement-breakpoint
INSERT INTO "sprint_goals" ("organization", "project", "team", "sprint_path", "general_objective")
SELECT DISTINCT
  ssg."organization",
  ssg."project",
  ssg."team",
  ssg."sprint_path",
  NULL
FROM "sprint_story_goals" ssg
WHERE NOT EXISTS (
  SELECT 1
  FROM "sprint_goals" sg
  WHERE sg."organization" = ssg."organization"
    AND sg."project" = ssg."project"
    AND sg."team" = ssg."team"
    AND sg."sprint_path" = ssg."sprint_path"
);--> statement-breakpoint
UPDATE "sprint_story_goals" ssg
SET "sprint_goal_id" = sg."id"
FROM "sprint_goals" sg
WHERE ssg."organization" = sg."organization"
  AND ssg."project" = sg."project"
  AND ssg."team" = sg."team"
  AND ssg."sprint_path" = sg."sprint_path";--> statement-breakpoint
ALTER TABLE "sprint_story_goals" ALTER COLUMN "sprint_goal_id" SET NOT NULL;--> statement-breakpoint
DROP INDEX "sprint_story_goals_scope_work_item_unique";--> statement-breakpoint
ALTER TABLE "sprint_story_goals" DROP COLUMN "organization";--> statement-breakpoint
ALTER TABLE "sprint_story_goals" DROP COLUMN "project";--> statement-breakpoint
ALTER TABLE "sprint_story_goals" DROP COLUMN "team";--> statement-breakpoint
ALTER TABLE "sprint_story_goals" DROP COLUMN "sprint_path";--> statement-breakpoint
ALTER TABLE "sprint_story_goals" ADD CONSTRAINT "sprint_story_goals_sprint_goal_id_sprint_goals_id_fk" FOREIGN KEY ("sprint_goal_id") REFERENCES "public"."sprint_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sprint_story_goals_sprint_goal_work_item_unique" ON "sprint_story_goals" USING btree ("sprint_goal_id","work_item_id");
