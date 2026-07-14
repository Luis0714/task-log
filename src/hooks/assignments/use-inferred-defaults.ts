"use client";

import { useCallback, useEffect, useState } from "react";

import {
  defaultKeyOf,
  type InferredDefaultRow,
} from "@/components/assignments/assignments-table";
import type { DefaultSlot } from "@/lib/assignments/default-slots";
import {
  listInferredDefaults,
  listTeamMembersByProjectAndTeam,
  type InferredAssignmentDto,
} from "@/services/assignments/assignments.service";

/** Miembros de un (proyecto, equipo) mapeados al slot de inferencia. */
async function membersForSlot(slot: DefaultSlot): Promise<InferredAssignmentDto[]> {
  // Un fallo de un equipo no debe tumbar el resto: cae a lista vacía.
  const members = await listTeamMembersByProjectAndTeam(
    slot.projectLabel,
    slot.teamName,
  ).catch(() => []);
  return members.map((m) => ({
    personAdoId: m.id,
    personDisplayName: m.displayName,
    projectId: slot.projectLabel,
    projectName: slot.projectLabel,
    teamId: slot.teamName,
    teamName: slot.teamName,
  }));
}

async function resolveInferredDefaultRows(
  slots: readonly DefaultSlot[],
): Promise<InferredDefaultRow[]> {
  const memberLists = await Promise.all(slots.map(membersForSlot));
  const inferred = await listInferredDefaults(memberLists.flat());
  return inferred.map((d) => ({ ...d, defaultKey: defaultKeyOf(d) }));
}

export type UseInferredDefaultsResult = {
  defaults: InferredDefaultRow[];
  /** True hasta que TERMINA la primera resolución (para el skeleton inicial). */
  initialLoading: boolean;
  removeDefault: (defaultKey: string) => void;
};

/**
 * Resuelve las filas "por defecto" (100% inferido) para los slots dados y
 * gestiona su estado de carga. Encapsula el fetch fuera del componente.
 */
export function useInferredDefaults(
  slots: DefaultSlot[],
): UseInferredDefaultsResult {
  const [defaults, setDefaults] = useState<InferredDefaultRow[]>([]);
  const [pending, setPending] = useState(true);
  const [loadedOnce, setLoadedOnce] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const finish = (rows: InferredDefaultRow[]) => {
      if (cancelled) return;
      setDefaults(rows);
      setPending(false);
      setLoadedOnce(true);
    };

    if (slots.length === 0) {
      finish([]);
      return;
    }

    setDefaults([]);
    setPending(true);
    resolveInferredDefaultRows(slots)
      .then(finish)
      .catch(() => finish([]));

    return () => {
      cancelled = true;
    };
  }, [slots]);

  const removeDefault = useCallback((defaultKey: string) => {
    setDefaults((prev) => prev.filter((d) => d.defaultKey !== defaultKey));
  }, []);

  return { defaults, initialLoading: pending && !loadedOnce, removeDefault };
}
