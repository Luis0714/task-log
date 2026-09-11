"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { saveDefaultRepositoryRequest } from "@/services/ado/ado-repository-defaults.service";
import { appToast } from "@/lib/toast/app-toast";

export function useSaveDefaultRepository() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const saveDefaultRepository = useCallback(
    async (repository: string) => {
      if (!repository || pending) return;

      setPending(true);
      try {
        await saveDefaultRepositoryRequest(repository);
        appToast.success(
          "Repositorio predeterminado guardado. Se usará al crear pull requests.",
        );
        router.refresh();
      } catch (cause) {
        appToast.fromError(cause, "No se pudo guardar el repositorio predeterminado.");
        throw cause;
      } finally {
        setPending(false);
      }
    },
    [pending, router],
  );

  return { saveDefaultRepository, saveDefaultRepositoryPending: pending };
}
