CREATE TABLE "sprint_story_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization" text NOT NULL,
	"project" text NOT NULL,
	"team" text NOT NULL,
	"sprint_path" text NOT NULL,
	"work_item_id" integer NOT NULL,
	"target_state_name" text,
	"target_tac_tag_name" text,
	"observation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "sprint_story_goals_scope_work_item_unique" ON "sprint_story_goals" USING btree ("organization","project","team","sprint_path","work_item_id");