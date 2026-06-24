"use client";

import { useCallback, useId, useMemo, useState } from "react";

import { bulkTaskSchema } from "@/lib/schemas/time-log";
import {
  getDefaultWorkingDate,
  getDefaultWorkingTime,
} from "@/lib/time-log/task-constants";
import {
  BULK_GROUP_LIMIT,
  type BulkGroup,
  type BulkTask,
  type BulkTaskResult,
} from "@/lib/time-log/bulk-group";

export type UseBulkGroupsOptions = {
  isTaskCreationMode: boolean;
  defaultTaskState?: string;
  /**
   * Actividad por defecto para tareas nuevas. Si el proyecto requiere Activity
   * y el usuario deja el select vacío, ADO rechaza con TF401320. Pre-poblar
   * con la primera actividad disponible evita el 422 sin obligar al usuario a
   * seleccionar manualmente cuando sólo quiere registrar horas rápidas.
   */
  defaultActivity?: string;
};

export type TaskValidation =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

export type TryAddTaskResult =
  | { added: true; newTaskId: string }
  | { added: false; errors: Record<string, string>; blockedTaskId: string };

export type TryAddGroupResult =
  | { added: true; newGroupId: string }
  | {
      added: false;
      invalidGroupId: string;
      invalidTaskId: string;
      errors: Record<string, string>;
    };

export type UseBulkGroupsResult = {
  groups: BulkGroup[];
  /** ID del grupo actualmente expandido (o null si ninguno). */
  openGroupId: string | null;
  /** ID de la tarea actualmente expandida (o null si ninguna). */
  openTaskId: string | null;
  setOpenGroupId: (id: string | null) => void;
  setOpenTaskId: (groupId: string, taskId: string | null) => void;
  /**
   * Valida la última tarea del grupo objetivo usando `validate(task)`. Si
   * pasa, agrega una tarea vacía y la marca como `openTaskId` para ese
   * grupo. Si falla, devuelve los errores y NO agrega.
   */
  tryAddTask: (
    groupId: string,
    validate: (task: BulkTask) => TaskValidation,
  ) => TryAddTaskResult;
  /**
   * Valida TODAS las tareas del grupo actual usando
   * `validateTask(task)`. Si pasan, agrega un grupo nuevo con una tarea
   * vacía. Si alguna falla, marca la primera inválida y la expande.
   */
  tryAddGroup: (
    groups: BulkGroup[],
    validateTask: (task: BulkTask) => TaskValidation,
  ) => TryAddGroupResult;
  removeGroup: (id: string) => void;
  removeTask: (groupId: string, taskId: string) => void;
  updateGroupField: <K extends keyof BulkGroup>(
    groupId: string,
    key: K,
    value: BulkGroup[K],
  ) => void;
  updateTask: (groupId: string, taskId: string, patch: Partial<BulkTask>) => void;
  updateTaskField: <K extends keyof BulkTask>(
    groupId: string,
    taskId: string,
    key: K,
    value: BulkTask[K],
  ) => void;
  setTaskResult: (groupId: string, taskId: string, result: BulkTaskResult) => void;
  replaceGroups: (next: BulkGroup[]) => void;
  reset: () => void;
  clearCompletedTasks: () => void;
  totalHours: number;
  validTaskCount: number;
  totalTaskCount: number;
  canAddGroup: boolean;
  canRemoveGroups: boolean;
  isAtLimit: boolean;
};

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildEmptyTask(
  isTaskCreationMode: boolean,
  defaultTaskState: string,
  id: string,
  defaultActivity = "",
): BulkTask {
  return {
    id,
    templateId: "",
    taskTitle: "",
    hours: "",
    description: "",
    activity: defaultActivity,
    workingDate: getDefaultWorkingDate(),
    workingTime: getDefaultWorkingTime(),
    taskState: defaultTaskState,
    markAsDone: !isTaskCreationMode,
    result: null,
    errors: {},
  };
}

function buildEmptyGroup(
  isTaskCreationMode: boolean,
  defaultTaskState: string,
  defaultActivity: string,
  groupId: string,
  taskId: string,
): BulkGroup {
  return {
    id: groupId,
    pbiId: "",
    tasks: [buildEmptyTask(isTaskCreationMode, defaultTaskState, taskId, defaultActivity)],
  };
}

/**
 * Calcula el outcome de "agregar tarea" leyendo el estado actual y
 * devolviendo el resultado + la transformación que debe aplicarse al
 * estado. Mantener la lógica fuera del reducer permite a TypeScript
 * inferir correctamente el union de retorno.
 */
function computeTryAddTaskOutcome(
  groups: BulkGroup[],
  groupId: string,
  validate: (task: BulkTask) => TaskValidation,
  isTaskCreationMode: boolean,
  defaultTaskState: string,
  defaultActivity: string,
): TryAddTaskResult {
  const group = groups.find((g) => g.id === groupId);
  if (!group) {
    return { added: false, errors: {}, blockedTaskId: "" };
  }
  const previous = group.tasks.at(-1);
  if (!previous) {
    const fresh = buildEmptyTask(
      isTaskCreationMode,
      defaultTaskState,
      newId("bulk-task"),
      defaultActivity,
    );
    return { added: true, newTaskId: fresh.id };
  }
  const validation = validate(previous);
  if (!validation.ok) {
    return {
      added: false,
      errors: validation.errors,
      blockedTaskId: previous.id,
    };
  }
  const totalTasks = groups.reduce((acc, g) => acc + g.tasks.length, 0);
  if (totalTasks >= BULK_GROUP_LIMIT) {
    return { added: false, errors: {}, blockedTaskId: previous.id };
  }
  const fresh = buildEmptyTask(
    isTaskCreationMode,
    defaultTaskState,
    newId("bulk-task"),
    defaultActivity,
  );
  return { added: true, newTaskId: fresh.id };
}

function appendTaskToGroup(
  groups: BulkGroup[],
  groupId: string,
  taskId: string,
  isTaskCreationMode: boolean,
  defaultTaskState: string,
  defaultActivity: string,
): BulkGroup[] {
  return groups.map((g) => {
    if (g.id !== groupId) return g;
    const fresh = buildEmptyTask(
      isTaskCreationMode,
      defaultTaskState,
      taskId,
      defaultActivity,
    );
    return { ...g, tasks: [...g.tasks, fresh] };
  });
}

function writeTaskErrorsOnGroup(
  groups: BulkGroup[],
  groupId: string,
  taskId: string,
  errors: Record<string, string>,
): BulkGroup[] {
  return groups.map((g) =>
    g.id === groupId
      ? {
          ...g,
          tasks: g.tasks.map((t) =>
            t.id === taskId ? { ...t, errors } : t,
          ),
        }
      : g,
  );
}

function countTotalTasks(groups: BulkGroup[]): number {
  return groups.reduce((acc, g) => acc + g.tasks.length, 0);
}

function computeTryAddGroupOutcome(
  groups: BulkGroup[],
  validateTask: (task: BulkTask) => TaskValidation,
): TryAddGroupResult {
  const previous = groups.at(-1);
  if (!previous) {
    const newGroupId = newId("bulk-group");
    return { added: true, newGroupId };
  }
  for (const task of previous.tasks) {
    const validation = validateTask(task);
    if (!validation.ok) {
      return {
        added: false,
        invalidGroupId: previous.id,
        invalidTaskId: task.id,
        errors: validation.errors,
      };
    }
  }
  if (countTotalTasks(groups) >= BULK_GROUP_LIMIT) {
    return {
      added: false,
      invalidGroupId: previous.id,
      invalidTaskId: previous.tasks.at(-1)?.id ?? "",
      errors: {},
    };
  }
  const newGroupId = newId("bulk-group");
  return { added: true, newGroupId };
}

function appendGroup(
  groups: BulkGroup[],
  groupId: string,
  isTaskCreationMode: boolean,
  defaultTaskState: string,
  defaultActivity: string,
): BulkGroup[] {
  const newTaskId = newId("bulk-task");
  const fresh = buildEmptyGroup(
    isTaskCreationMode,
    defaultTaskState,
    defaultActivity,
    groupId,
    newTaskId,
  );
  return [...groups, fresh];
}

function writeFirstInvalidTaskErrors(
  groups: BulkGroup[],
  taskId: string,
  errors: Record<string, string>,
): BulkGroup[] {
  return groups.map((g, idx) =>
    idx === groups.length - 1
      ? {
          ...g,
          tasks: g.tasks.map((t) =>
            t.id === taskId ? { ...t, errors } : t,
          ),
        }
      : g,
  );
}

function parseHours(raw: string): number {
  const parsed = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Helper para que el caller detecte si una tarea concreta es válida (mismo
 * criterio que `validTaskCount`) sin re-correr el schema en cada render.
 */
export function isBulkTaskValid(task: BulkTask): boolean {
  return bulkTaskSchema.safeParse({
    taskTitle: task.taskTitle,
    hours: task.hours,
    description: task.description,
    activity: task.activity,
    workingDate: task.workingDate,
    workingTime: task.workingTime,
    taskState: task.taskState,
    markAsDone: task.markAsDone,
  }).success;
}

/**
 * Helper que mapea los issues de Zod a un `Record<field, message>` para
 * persistir en `BulkTask.errors`.
 */
export function mapBulkTaskIssuesToErrors(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "_task");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function useBulkGroups({
  isTaskCreationMode,
  defaultTaskState = "",
  defaultActivity = "",
}: UseBulkGroupsOptions): UseBulkGroupsResult {
  // useId() devuelve un id estable entre SSR e hidratación. Si usáramos
  // crypto.randomUUID() en el inicializador del useState, server y client
  // generarían UUIDs distintos y los `id` / `htmlFor` derivados provocarían
  // un mismatch de hidratación.
  const reactId = useId();

  // Pre-computamos el grupo y tarea iniciales una sola vez por render del
  // hook. Esto evita leer refs durante render y mantiene `groups`,
  // `openGroupId` y `openTaskId` sincronizados en el primer render.
  const [initialGroup] = useState<BulkGroup>(() =>
    buildEmptyGroup(
      isTaskCreationMode,
      defaultTaskState,
      defaultActivity,
      `bulk-group-${reactId}`,
      `bulk-task-${reactId}`,
    ),
  );
  const [groups, setGroups] = useState<BulkGroup[]>(() => [initialGroup]);
  const [openGroupId, setOpenGroupId] = useState<string | null>(
    () => initialGroup.id,
  );
  // La primera tarea arranca colapsada: el usuario primero debe escoger
  // una Historia de Usuario antes de empezar a llenarla. El form se
  // encarga de expandirla cuando `onPbiChange` recibe un pbiId.
  const [openTaskId, setOpenTaskIdRaw] = useState<string | null>(null);

  const setOpenTaskId = useCallback(
    (groupId: string, taskId: string | null) => {
      setOpenTaskIdRaw(taskId);
      // Al fijar la tarea activa, aseguramos que su grupo también esté
      // abierto para que el usuario la vea.
      if (taskId) setOpenGroupId(groupId);
    },
    [],
  );

  const replaceGroups = useCallback((next: BulkGroup[]) => {
    setGroups(next);
    setOpenGroupId((current) => {
      if (current && next.some((group) => group.id === current)) return current;
      return next[0]?.id ?? null;
    });
    setOpenTaskIdRaw((current) => {
      if (!current) return next[0]?.tasks[0]?.id ?? null;
      const found = next.find((g) => g.tasks.some((t) => t.id === current));
      if (found) return current;
      return next[0]?.tasks[0]?.id ?? null;
    });
  }, []);

  const tryAddTask = useCallback<UseBulkGroupsResult["tryAddTask"]>(
    (groupId, validate) => {
      // El outcome se calcula leyendo el estado actual de `groups` (closure)
      // y luego se aplica vía setGroups. Esto evita callbacks de actualización
      // con lógica de retorno compleja que TypeScript no puede tipar bien.
      const result = computeTryAddTaskOutcome(
        groups,
        groupId,
        validate,
        isTaskCreationMode,
        defaultTaskState,
        defaultActivity,
      );

      if (result.added) {
        setGroups((current) =>
          appendTaskToGroup(
            current,
            groupId,
            result.newTaskId,
            isTaskCreationMode,
            defaultTaskState,
            defaultActivity,
          ),
        );
        setOpenGroupId(groupId);
        setOpenTaskIdRaw(result.newTaskId);
      } else {
        setGroups((current) =>
          writeTaskErrorsOnGroup(
            current,
            groupId,
            result.blockedTaskId,
            result.errors,
          ),
        );
        setOpenGroupId(groupId);
        setOpenTaskIdRaw(result.blockedTaskId);
      }

      return result;
    },
    [defaultActivity, defaultTaskState, groups, isTaskCreationMode],
  );

  const tryAddGroup = useCallback<UseBulkGroupsResult["tryAddGroup"]>(
    (currentGroups, validateTask) => {
      const result = computeTryAddGroupOutcome(currentGroups, validateTask);

      if (result.added) {
        setGroups((current) =>
          appendGroup(
            current,
            result.newGroupId,
            isTaskCreationMode,
            defaultTaskState,
            defaultActivity,
          ),
        );
        setOpenGroupId(result.newGroupId);
        // La nueva tarea queda colapsada hasta que el usuario escoja una
        // Historia de Usuario — la historia recién creada no debe mostrar
        // campos de tarea hasta confirmar la PBI.
        setOpenTaskIdRaw(null);
      } else {
        setGroups((current) =>
          writeFirstInvalidTaskErrors(
            current,
            result.invalidTaskId,
            result.errors,
          ),
        );
        setOpenGroupId(result.invalidGroupId);
        setOpenTaskIdRaw(result.invalidTaskId);
      }

      return result;
    },
    [defaultActivity, defaultTaskState, isTaskCreationMode],
  );

  const removeGroup = useCallback((id: string) => {
    setGroups((current) => {
      if (current.length <= 1) return current;
      const next = current.filter((g) => g.id !== id);
      // Si dejamos el array vacío, reponemos un grupo vacío.
      if (next.length === 0) {
        const newGroupId = newId("bulk-group");
        const newTaskId = newId("bulk-task");
        return [
          buildEmptyGroup(
            isTaskCreationMode,
            defaultTaskState,
            defaultActivity,
            newGroupId,
            newTaskId,
          ),
        ];
      }
      return next;
    });
    setOpenGroupId((current) => (current === id ? null : current));
    setOpenTaskIdRaw((current) => {
      const stillExists = groups.some((g) => g.tasks.some((t) => t.id === current));
      return stillExists ? current : null;
    });
  }, [defaultActivity, defaultTaskState, groups, isTaskCreationMode]);

  const removeTask = useCallback((groupId: string, taskId: string) => {
    setGroups((current) => {
      const idx = current.findIndex((g) => g.id === groupId);
      if (idx < 0) return current;
      const group = current[idx]!;
      const remaining = group.tasks.filter((t) => t.id !== taskId);
      // Si era la única tarea, eliminamos el grupo entero.
      if (remaining.length === 0) {
        const nextGroups = current.filter((_, i) => i !== idx);
        if (nextGroups.length === 0) {
          const newGroupId = newId("bulk-group");
          const newTaskId = newId("bulk-task");
          return [
            buildEmptyGroup(
              isTaskCreationMode,
              defaultTaskState,
              defaultActivity,
              newGroupId,
              newTaskId,
            ),
          ];
        }
        return nextGroups;
      }
      return current.map((g, i) =>
        i === idx ? { ...g, tasks: remaining } : g,
      );
    });
    setOpenTaskIdRaw((current) => (current === taskId ? null : current));
  }, [defaultActivity, defaultTaskState, isTaskCreationMode]);

  const updateGroupField = useCallback(
    <K extends keyof BulkGroup>(groupId: string, key: K, value: BulkGroup[K]) => {
      setGroups((current) =>
        current.map((g) => (g.id === groupId ? { ...g, [key]: value } : g)),
      );
    },
    [],
  );

  const updateTask = useCallback(
    (groupId: string, taskId: string, patch: Partial<BulkTask>) => {
      setGroups((current) =>
        current.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            tasks: g.tasks.map((t) => {
              if (t.id !== taskId) return t;
              const clearedErrors: Record<string, string | undefined> = {
                ...t.errors,
              };
              for (const k of Object.keys(patch)) {
                if (k === "id" || k === "errors" || k === "result") continue;
                if (Object.hasOwn(clearedErrors, k)) {
                  clearedErrors[k] = undefined;
                }
              }
              return { ...t, ...patch, errors: clearedErrors };
            }),
          };
        }),
      );
    },
    [],
  );

  const updateTaskField = useCallback(
    <K extends keyof BulkTask>(
      groupId: string,
      taskId: string,
      key: K,
      value: BulkTask[K],
    ) => {
      setGroups((current) =>
        current.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            tasks: g.tasks.map((t) => {
              if (t.id !== taskId) return t;
              const nextErrors = { ...t.errors };
              // Sólo limpiamos el error si la clave también es una clave
              // válida de `errors`. Campos como `templateId` no tienen
              // entrada en errors y deben ignorarse aquí.
              if (
                key !== "result" &&
                key !== "errors" &&
                key !== "id" &&
                Object.hasOwn(nextErrors, key)
              ) {
                nextErrors[key as keyof typeof nextErrors] = undefined;
              }
              return {
                ...t,
                [key]: value,
                errors: nextErrors,
              };
            }),
          };
        }),
      );
    },
    [],
  );

  const setTaskResult = useCallback(
    (groupId: string, taskId: string, result: BulkTaskResult) => {
      setGroups((current) =>
        current.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, result } : t)),
          };
        }),
      );
    },
    [],
  );

  const reset = useCallback(() => {
    const newGroupId = newId("bulk-group");
    const newTaskId = newId("bulk-task");
    const fresh = buildEmptyGroup(
      isTaskCreationMode,
      defaultTaskState,
      defaultActivity,
      newGroupId,
      newTaskId,
    );
    setGroups([fresh]);
    setOpenGroupId(newGroupId);
    setOpenTaskIdRaw(newTaskId);
  }, [defaultActivity, defaultTaskState, isTaskCreationMode]);

  const clearCompletedTasks = useCallback(() => {
    setGroups((current) => {
      const groupsAfter: BulkGroup[] = [];
      for (const g of current) {
        const remaining = g.tasks.filter((t) => t.result?.ok !== true);
        if (remaining.length > 0) {
          groupsAfter.push({ ...g, tasks: remaining });
        }
      }
      if (groupsAfter.length === 0) {
        const newGroupId = newId("bulk-group");
        const newTaskId = newId("bulk-task");
        groupsAfter.push(
          buildEmptyGroup(
            isTaskCreationMode,
            defaultTaskState,
            defaultActivity,
            newGroupId,
            newTaskId,
          ),
        );
      }
      return groupsAfter;
    });
  }, [defaultActivity, defaultTaskState, isTaskCreationMode]);

  const { totalHours, validTaskCount, totalTaskCount } = useMemo(() => {
    let hours = 0;
    let valid = 0;
    let total = 0;
    for (const group of groups) {
      for (const task of group.tasks) {
        total += 1;
        const parsed = bulkTaskSchema.safeParse({
          taskTitle: task.taskTitle,
          hours: task.hours,
          description: task.description,
          activity: task.activity,
          workingDate: task.workingDate,
          workingTime: task.workingTime,
          taskState: task.taskState,
          markAsDone: task.markAsDone,
        });
        if (parsed.success) {
          hours += parseHours(parsed.data.hours);
          valid += 1;
        }
      }
    }
    // Redondeo a 2 decimales para evitar artefactos de coma flotante
    // (p. ej. 1.5 + 1.5 + 1.5 = 4.4999999999). Las horas se muestran tal
    // cual; el formatea visual ya añade la "h".
    return {
      totalHours: Math.round(hours * 100) / 100,
      validTaskCount: valid,
      totalTaskCount: total,
    };
  }, [groups]);

  return {
    groups,
    openGroupId,
    openTaskId,
    setOpenGroupId,
    setOpenTaskId,
    tryAddTask,
    tryAddGroup,
    removeGroup,
    removeTask,
    updateGroupField,
    updateTask,
    updateTaskField,
    setTaskResult,
    replaceGroups,
    reset,
    clearCompletedTasks,
    totalHours,
    validTaskCount,
    totalTaskCount,
    canAddGroup: totalTaskCount < BULK_GROUP_LIMIT,
    canRemoveGroups: groups.length > 1,
    isAtLimit: totalTaskCount >= BULK_GROUP_LIMIT,
  };
}
