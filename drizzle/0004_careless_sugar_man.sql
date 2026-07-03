CREATE TABLE "sprint_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization" text NOT NULL,
	"project" text NOT NULL,
	"team" text NOT NULL,
	"sprint_path" text NOT NULL,
	"general_objective" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "sprint_goals_scope_unique" ON "sprint_goals" USING btree ("organization","project","team","sprint_path");