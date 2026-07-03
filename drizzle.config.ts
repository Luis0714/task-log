import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const url =
  process.env.DATABASE_URL_UNPOOLED?.trim() ??
  process.env.DATABASE_URL?.trim();

if (!url) {
  throw new Error(
    "Define DATABASE_URL_UNPOOLED o DATABASE_URL para ejecutar drizzle-kit.",
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
