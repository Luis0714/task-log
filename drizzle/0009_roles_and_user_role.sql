CREATE TABLE IF NOT EXISTS "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "display_name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_unique" ON "roles" ("name");

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role_id" uuid REFERENCES "roles"("id");
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;

INSERT INTO "roles" ("name", "display_name") VALUES
  ('developer',       'Developer'),
  ('qa',              'QA'),
  ('scrum_master',    'Scrum Master'),
  ('product_owner',   'Product Owner'),
  ('product_manager', 'Product Manager'),
  ('super_admin',     'SuperAdmin')
ON CONFLICT ("name") DO NOTHING;
