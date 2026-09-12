import "server-only";

import { verifyPassword } from "@/lib/security/password";
import { timingSafeStringEqual } from "@/lib/security/timing-safe-string-equal";

function configuredPasswordHash(): string {
  return process.env.SUPER_ADMIN_PASSWORD_HASH?.trim() ?? "";
}

function configuredPassword(): string {
  return process.env.SUPER_ADMIN_PASSWORD ?? "";
}

export function isSuperAdminUnlockConfigured(): boolean {
  return Boolean(configuredPasswordHash() || configuredPassword().trim());
}

export function resolveSuperAdminEmail(): string | undefined {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim();
  return email || undefined;
}

export async function verifySuperAdminPassword(plain: string): Promise<boolean> {
  const hash = configuredPasswordHash();
  if (hash) {
    return verifyPassword(plain, hash);
  }

  const expected = configuredPassword();
  if (!expected.trim() || !plain) return false;
  return timingSafeStringEqual(plain, expected);
}
