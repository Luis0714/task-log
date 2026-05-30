import "server-only";

import { isDatabaseConfigured } from "@/lib/db/client";
import { isEncryptionConfigured } from "@/lib/security/encryption-key";

/** Listo para registro/login con datos persistidos (PAT u OAuth en BD). */
export function isUserPersistenceReady(): boolean {
  return isDatabaseConfigured() && isEncryptionConfigured();
}
