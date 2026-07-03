import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL no está definida");
  process.exit(1);
}

const sql = neon(url);
try {
  await sql`ALTER TABLE project_configurations ADD COLUMN IF NOT EXISTS responsable_fields jsonb NOT NULL DEFAULT '[]'::jsonb`;
  console.log("OK: responsable_fields added");
  const rows = await sql`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'project_configurations' AND column_name = 'responsable_fields'
  `;
  console.log(JSON.stringify(rows, null, 2));
} catch (e) {
  console.error("ERROR:", e.message);
  process.exitCode = 1;
}