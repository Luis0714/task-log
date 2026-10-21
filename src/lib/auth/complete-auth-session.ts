import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { beginAuthRehydration } from "@/lib/auth/auth-rehydration";
import { sanitizeReturnPath } from "@/lib/auth/return-path";

/** Rehidrata la UI tras login/registro cuando la sesión ya está en cookie. */
export function completeAuthSession(
  router: AppRouterInstance,
  destination = "/",
): void {
  const target = sanitizeReturnPath(destination) ?? "/";
  const current = `${window.location.pathname}${window.location.search}`;

  beginAuthRehydration();
  if (current === target) {
    router.refresh();
    return;
  }

  window.location.assign(target);
}
