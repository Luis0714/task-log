import "server-only";

import { decryptSecret, encryptSecret } from "@/lib/security/secret-cipher";

export type PatAdoSecrets = {
  kind: "pat";
  pat: string;
};

export type OAuthAdoSecrets = {
  kind: "oauth";
  refreshToken: string;
};

export type AdoSecretsPayload = PatAdoSecrets | OAuthAdoSecrets;

export function encryptAdoSecrets(secrets: AdoSecretsPayload): string {
  return encryptSecret(JSON.stringify(secrets));
}

export function decryptAdoSecrets(encrypted: string): AdoSecretsPayload {
  const parsed = JSON.parse(decryptSecret(encrypted)) as AdoSecretsPayload;

  if (parsed.kind === "pat" && typeof parsed.pat === "string") {
    return parsed;
  }

  if (
    parsed.kind === "oauth" &&
    typeof parsed.refreshToken === "string"
  ) {
    return parsed;
  }

  throw new Error("Formato de secretos ADO no reconocido.");
}
