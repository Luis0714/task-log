/// <reference types="node" />
import "server-only";

import { sql } from "drizzle-orm";

import { getConnectAuthOptions } from "@/lib/auth/connect-auth-options";
import { isEntraOAuthConfigured } from "@/lib/auth/entra";
import { getAzdoAuthMethod } from "@/lib/auth/auth-method";
import { isIronSessionConfigured } from "@/lib/auth/session";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { getDatabaseUrlSource } from "@/lib/db/resolve-database-url";
import { isUserPersistenceReady } from "@/lib/db/is-persistence-ready";
import { isEncryptionConfigured } from "@/lib/security/encryption-key";

export type EnvVarCheck = {
  set: boolean;
  valid?: boolean;
};

export type DeploymentHealthReport = {
  ok: boolean;
  environment: string;
  azdoAuthMethod: ReturnType<typeof getAzdoAuthMethod>;
  config: {
    DATABASE_URL: EnvVarCheck;
    POSTGRES_URL: EnvVarCheck;
    databaseUrlSource: ReturnType<typeof getDatabaseUrlSource>;
    ENCRYPTION_KEY: EnvVarCheck;
    IRON_SESSION_PASSWORD: EnvVarCheck;
    AUTH_BASE_URL: EnvVarCheck;
    AZURE_AD_CLIENT_ID: EnvVarCheck;
    AZURE_AD_CLIENT_SECRET: EnvVarCheck;
    OPENAI_API_KEY: EnvVarCheck;
  };
  features: {
    persistenceReady: boolean;
    sessionReady: boolean;
    oauthReady: boolean;
    patReady: boolean;
    accountsAvailable: boolean;
  };
  database: {
    reachable: boolean | null;
    schemaReady: boolean | null;
    issue: "not_configured" | "unreachable" | "schema_missing" | null;
  };
  missingRequired: string[];
  hints: string[];
};

function envSet(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function ironSessionCheck(): EnvVarCheck {
  const set = envSet("IRON_SESSION_PASSWORD");
  return { set, valid: set ? isIronSessionConfigured() : false };
}

function encryptionKeyCheck(): EnvVarCheck {
  const set = envSet("ENCRYPTION_KEY");
  return { set, valid: set ? isEncryptionConfigured() : false };
}

async function probeDatabase(): Promise<
  Pick<DeploymentHealthReport["database"], "reachable" | "schemaReady" | "issue">
> {
  if (!isDatabaseConfigured()) {
    return { reachable: null, schemaReady: null, issue: "not_configured" };
  }

  try {
    await getDb().execute(sql`SELECT 1`);
  } catch {
    return { reachable: false, schemaReady: null, issue: "unreachable" };
  }

  try {
    await getDb().execute(sql`SELECT 1 FROM users LIMIT 1`);
    return { reachable: true, schemaReady: true, issue: null };
  } catch {
    return { reachable: true, schemaReady: false, issue: "schema_missing" };
  }
}

function buildHints(input: {
  missingRequired: string[];
  database: DeploymentHealthReport["database"];
  features: DeploymentHealthReport["features"];
  azdoAuthMethod: ReturnType<typeof getAzdoAuthMethod>;
}): string[] {
  const hints: string[] = [];

  if (input.missingRequired.includes("DATABASE_URL")) {
    hints.push(
      "Añade DATABASE_URL o conecta Neon en Vercel (POSTGRES_URL). También copia ENCRYPTION_KEY e IRON_SESSION_PASSWORD desde .env.local.",
    );
  }

  if (input.missingRequired.includes("ENCRYPTION_KEY")) {
    hints.push(
      "Añade ENCRYPTION_KEY (32+ bytes en base64/hex o cadena UTF-8 de 32+ caracteres).",
    );
  }

  if (input.missingRequired.includes("IRON_SESSION_PASSWORD")) {
    hints.push("Añade IRON_SESSION_PASSWORD con al menos 32 caracteres.");
  }

  if (input.database.issue === "unreachable") {
    hints.push("DATABASE_URL está definida pero la conexión falló. Revisa la URL en Neon/Vercel.");
  }

  if (input.database.issue === "schema_missing") {
    hints.push("Ejecuta las migraciones en producción: pnpm db:migrate con DATABASE_URL_UNPOOLED.");
  }

  if (!input.features.oauthReady && (input.azdoAuthMethod === "oauth" || input.azdoAuthMethod === "both")) {
    if (!isEntraOAuthConfigured()) {
      hints.push(
        "Para Microsoft: configura AUTH_BASE_URL, AZURE_AD_CLIENT_ID y AZURE_AD_CLIENT_SECRET.",
      );
    }
  }

  if (hints.length === 0 && !input.features.accountsAvailable) {
    hints.push("Redeploy en Vercel después de cambiar variables de entorno.");
  }

  return hints;
}

function collectMissingRequired(
  config: DeploymentHealthReport["config"],
): string[] {
  const missing: string[] = [];

  if (!isDatabaseConfigured()) missing.push("DATABASE_URL");
  if (!config.ENCRYPTION_KEY.set) missing.push("ENCRYPTION_KEY");
  else if (config.ENCRYPTION_KEY.valid === false) {
    missing.push("ENCRYPTION_KEY");
  }

  if (!config.IRON_SESSION_PASSWORD.set) missing.push("IRON_SESSION_PASSWORD");
  else if (config.IRON_SESSION_PASSWORD.valid === false) {
    missing.push("IRON_SESSION_PASSWORD");
  }

  return missing;
}

export async function getDeploymentHealthReport(): Promise<DeploymentHealthReport> {
  const connectOptions = getConnectAuthOptions();
  const azdoAuthMethod = getAzdoAuthMethod();

  const config: DeploymentHealthReport["config"] = {
    DATABASE_URL: { set: envSet("DATABASE_URL") },
    POSTGRES_URL: { set: envSet("POSTGRES_URL") },
    databaseUrlSource: getDatabaseUrlSource(),
    ENCRYPTION_KEY: encryptionKeyCheck(),
    IRON_SESSION_PASSWORD: ironSessionCheck(),
    AUTH_BASE_URL: { set: envSet("AUTH_BASE_URL") },
    AZURE_AD_CLIENT_ID: { set: envSet("AZURE_AD_CLIENT_ID") },
    AZURE_AD_CLIENT_SECRET: { set: envSet("AZURE_AD_CLIENT_SECRET") },
    OPENAI_API_KEY: { set: envSet("OPENAI_API_KEY") },
  };

  const database = await probeDatabase();
  const missingRequired = collectMissingRequired(config);

  const accountsAvailable = isUserPersistenceReady();
  const ok =
    accountsAvailable &&
    connectOptions.sessionReady &&
    database.reachable === true &&
    database.schemaReady === true;

  const features = {
    persistenceReady: connectOptions.persistenceReady,
    sessionReady: connectOptions.sessionReady,
    oauthReady: connectOptions.oauthReady,
    patReady: connectOptions.patReady,
    accountsAvailable,
  };

  return {
    ok,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    azdoAuthMethod,
    config,
    features,
    database,
    missingRequired,
    hints: buildHints({ missingRequired, database, features, azdoAuthMethod }),
  };
}
