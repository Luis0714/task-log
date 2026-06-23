"use client";

import { useEffect, useState } from "react";

import {
  FALLBACK_TASK_META,
  FALLBACK_TASK_STATE_NAMES,
  type TaskMetaResponse,
} from "@/lib/copilot/task-meta";

export type TaskMeta = TaskMetaResponse;

export function useTaskMeta(): TaskMeta {
  // Empezamos SIEMPRE con el fallback visible: si la API falla o devuelve
  // vacío, el campo de actividad del formulario no desaparece. La única
  // forma de "ocultar" el campo es que el proceso real del proyecto NO
  // tenga el campo Activity (p.ej. Basic), y eso lo sabemos en el
  // backend, no en el cliente.
  const [meta, setMeta] = useState<TaskMeta>(FALLBACK_TASK_META);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/copilot/task-meta")
      .then((res) => (res.ok ? (res.json() as Promise<TaskMetaResponse>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        setMeta({
          // Si la API devuelve activities vacías (proceso Basic o ADO sin
          // permisos), conservamos el fallback: mostrar `[]` en el
          // selector rompe el formulario y hace fallar el POST a Azure
          // con TF401320.
          activities:
            data.activities.length > 0 ? data.activities : FALLBACK_TASK_META.activities,
          stateNames:
            data.stateNames.length > 0 ? data.stateNames : FALLBACK_TASK_STATE_NAMES,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return meta;
}
