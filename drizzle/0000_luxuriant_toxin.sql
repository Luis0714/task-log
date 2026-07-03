CREATE TYPE "public"."ado_auth_method" AS ENUM('pat', 'oauth');--> statement-breakpoint
CREATE TYPE "public"."user_auth_provider" AS ENUM('local', 'entra');--> statement-breakpoint
CREATE TABLE "ado_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"auth_method" "ado_auth_method" NOT NULL,
	"organization" text NOT NULL,
	"project" text NOT NULL,
	"team" text,
	"encrypted_secrets" text NOT NULL,
	"ado_profile_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text,
	"password_hash" text,
	"auth_provider" "user_auth_provider" NOT NULL,
	"entra_subject" text,
	"email" text,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ado_connections" ADD CONSTRAINT "ado_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ado_connections_user_id_unique" ON "ado_connections" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "users_entra_subject_unique" ON "users" USING btree ("entra_subject");