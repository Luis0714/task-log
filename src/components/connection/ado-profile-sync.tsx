"use client";

import { useEffect, useRef } from "react";

type AdoProfileSyncProps = {
  isConnected: boolean;
};

/** Persiste el perfil ADO en cookie (solo permitido vía Route Handler). */
export function AdoProfileSync({ isConnected }: AdoProfileSyncProps) {
  const synced = useRef(false);

  useEffect(() => {
    if (!isConnected || synced.current) return;
    synced.current = true;
    void fetch("/api/ado/profile/sync", { method: "POST" }).catch(() => {
      synced.current = false;
    });
  }, [isConnected]);

  return null;
}
