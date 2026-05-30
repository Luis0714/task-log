import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "@/lib/db/schema";

type Db = NeonHttpDatabase<typeof schema>;

let cachedDb: Db | undefined;

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL no está definida. Configúrala en .env.local o en Vercel.",
    );
  }
  return url;
}

/** Cliente Drizzle (singleton lazy para no fallar al importar sin env en herramientas). */
export function getDb(): Db {
  if (!cachedDb) {
    cachedDb = drizzle(neon(requireDatabaseUrl()), { schema });
  }
  return cachedDb;
}

/** True si la app puede usar Postgres (Neon). */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
