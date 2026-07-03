CREATE TYPE "llm_interaction_feature" AS ENUM ('log-work', 'create-tasks', 'weekly-summary', 'chat');

CREATE TABLE "llm_interactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "feature" "llm_interaction_feature" NOT NULL,
  "model" text NOT NULL,
  "prompt_tokens" integer,
  "completion_tokens" integer,
  "latency_ms" integer NOT NULL,
  "request_hash" text NOT NULL,
  "response_json" jsonb NOT NULL,
  "ok" boolean NOT NULL,
  "error_message" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "llm_interactions_user_created_idx"
  ON "llm_interactions" ("user_id", "created_at" DESC);

CREATE INDEX "llm_interactions_feature_created_idx"
  ON "llm_interactions" ("feature", "created_at" DESC);
