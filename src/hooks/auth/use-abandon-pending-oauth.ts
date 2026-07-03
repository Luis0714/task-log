"use client";

import { useEffect } from "react";

/** Descarta OAuth pendiente al volver a la pantalla de login. */
export function useAbandonPendingOAuth() {
  useEffect(() => {
    void fetch("/api/auth/azdo/abandon", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    });
  }, []);
}
