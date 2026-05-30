import "server-only";

import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";

import { resolveDatabaseUrl } from "@/lib/db/resolve-database-url";
import * as schema from "@/lib/db/schema";

type Db = NeonDatabase<typeof schema>;

let cachedDb: Db | undefined;

function requireDatabaseUrl(): string {
  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL (o POSTGRES_URL de Vercel/Neon) no está definida. Configúrala en .env.local o en Vercel.",
    );
  }
  return url;
}

/** Cliente Drizzle con WebSocket (soporta transacciones en Neon). */
export function getDb(): Db {
  if (!cachedDb) {
    cachedDb = drizzle({
      connection: requireDatabaseUrl(),
      schema,
      ws,
    });
  }
  return cachedDb;
}

/** True si la app puede usar Postgres (Neon). */
export function isDatabaseConfigured(): boolean {
  return Boolean(resolveDatabaseUrl());
}
