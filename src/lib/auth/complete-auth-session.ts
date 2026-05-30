import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { beginAuthRehydration } from "@/lib/auth/auth-rehydration";

/** Rehidrata la UI tras login/registro cuando la sesión ya está en cookie. */
export function completeAuthSession(
  router: AppRouterInstance,
  destination = "/",
): void {
  const targetPath = destination.split("?")[0] || "/";
  const onTargetPage = window.location.pathname === targetPath;

  if (onTargetPage) {
    beginAuthRehydration();
    router.refresh();
    return;
  }

  beginAuthRehydration();
  window.location.assign(destination);
}
