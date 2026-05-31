CREATE TYPE "public"."sprint_snapshot_source" AS ENUM('manual', 'auto');--> statement-breakpoint
CREATE TYPE "public"."sprint_story_goal_status" AS ENUM('achieved', 'partial', 'missed', 'excluded', 'no_target');--> statement-breakpoint
CREATE TABLE "sprint_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sprint_goal_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"finalized_at" timestamp with time zone NOT NULL,
	"finalized_by_user_id" uuid,
	"finalized_by_display_name" text,
	"source" "sprint_snapshot_source" NOT NULL,
	"general_objective" text,
	"sprint_name" text,
	"sprint_start_date" text,
	"sprint_finish_date" text,
	"goals_total_count" integer DEFAULT 0 NOT NULL,
	"goals_achieved_count" integer DEFAULT 0 NOT NULL,
	"goals_partial_count" integer DEFAULT 0 NOT NULL,
	"goals_missed_count" integer DEFAULT 0 NOT NULL,
	"goals_excluded_count" integer DEFAULT 0 NOT NULL,
	"goals_no_target_count" integer DEFAULT 0 NOT NULL,
	"story_points_in_goal" real DEFAULT 0 NOT NULL,
	"story_points_achieved" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "sprint_story_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sprint_snapshot_id" uuid NOT NULL,
	"work_item_id" integer NOT NULL,
	"title" text NOT NULL,
	"assigned_to" text,
	"effort" real,
	"included_in_goal" boolean DEFAULT true NOT NULL,
	"baseline_state_name" text,
	"baseline_tac_tag_name" text,
	"target_state_name" text,
	"target_tac_tag_name" text,
	"final_state_name" text,
	"final_tac_tag_name" text,
	"goal_status" "sprint_story_goal_status" NOT NULL,
	"observation" text
);--> statement-breakpoint
ALTER TABLE "sprint_snapshots" ADD CONSTRAINT "sprint_snapshots_sprint_goal_id_sprint_goals_id_fk" FOREIGN KEY ("sprint_goal_id") REFERENCES "public"."sprint_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprint_snapshots" ADD CONSTRAINT "sprint_snapshots_finalized_by_user_id_users_id_fk" FOREIGN KEY ("finalized_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprint_story_snapshots" ADD CONSTRAINT "sprint_story_snapshots_sprint_snapshot_id_sprint_snapshots_id_fk" FOREIGN KEY ("sprint_snapshot_id") REFERENCES "public"."sprint_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sprint_snapshots_sprint_goal_version_unique" ON "sprint_snapshots" USING btree ("sprint_goal_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "sprint_story_snapshots_snapshot_work_item_unique" ON "sprint_story_snapshots" USING btree ("sprint_snapshot_id","work_item_id");
