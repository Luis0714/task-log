"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopilotTaskRow } from "@/components/copilot/copilot-task-row";
import type { AzdoAuthMethod } from "@/lib/auth/auth-method";
import type { CreateTaskBatchItem, CreateTasksBatch } from "@/lib/schemas/agent";
import {
  buildEmptyTask,
  groupTasksByPbi,
  isValidTask,
} from "@/lib/copilot/task-preview.utils";
import { totalHours } from "@/lib/copilot/copilot.utils";

export type CopilotCreateTasksFormProps = {
  preview: CreateTasksBatch;
  sprintPath: string;
  team: string;
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  loading?: boolean;
  onConfirm: (tasks: CreateTaskBatchItem[]) => void;
  onCancel: () => void;
};

export function CopilotCreateTasksForm({
  preview,
  sprintPath,
  team,
  adoExecutionReady,
  authMethod: _authMethod,
  loading = false,
  onConfirm,
  onCancel,
}: Readonly<CopilotCreateTasksFormProps>) {
  const [tasks, setTasks] = useState<CreateTaskBatchItem[]>(
    preview.tasks.map((t) => ({ ...t, markAsDone: true })),
  );

  const updateTask = (index: number, next: CreateTaskBatchItem) => {
    setTasks((current) => current.map((task, i) => (i === index ? next : task)));
  };

  const removeTask = (index: number) => {
    setTasks((current) => current.filter((_, i) => i !== index));
  };

  const addTask = () => {
    setTasks((current) => [...current, buildEmptyTask(sprintPath, team)]);
  };

  const validCount = tasks.filter(isValidTask).length;
  const validTotalHours = totalHours(tasks.filter(isValidTask));
  const canConfirm = validCount > 0 && !loading && adoExecutionReady;

  const groups = groupTasksByPbi(tasks);
  const pbiIds = [...groups.keys()];
  const isMultiPbi = pbiIds.length > 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {tasks.length} actividad{tasks.length === 1 ? "" : "es"} para registrar
          {isMultiPbi && (
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              en {pbiIds.length} historias de usuario
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Revisa los detalles. Al confirmar, las tasks se crearán como Done en Azure DevOps.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isMultiPbi ? (
          <MultiPbiTaskList
            tasks={tasks}
            pbiIds={pbiIds}
            groups={groups}
            sprintPath={sprintPath}
            loading={loading}
            onUpdate={updateTask}
            onRemove={removeTask}
          />
        ) : (
          <SinglePbiTaskList
            tasks={tasks}
            sprintPath={sprintPath}
            loading={loading}
            onUpdate={updateTask}
            onRemove={removeTask}
          />
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTask}
          disabled={loading}
          className="w-full"
        >
          <Plus className="size-4" aria-hidden /> Agregar otra actividad
        </Button>
      </CardContent>

      <CardFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
        <span className="text-muted-foreground text-xs">
          {validCount} de {tasks.length} listas · {validTotalHours}h en total
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" disabled={!canConfirm} onClick={() => onConfirm(tasks)}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="size-4" aria-hidden />
            )}
            {tasks.length === 1 ? "Confirmar y crear" : `Confirmar ${tasks.length} actividades`}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

type TaskListProps = {
  tasks: CreateTaskBatchItem[];
  sprintPath: string;
  loading: boolean;
  onUpdate: (index: number, next: CreateTaskBatchItem) => void;
  onRemove: (index: number) => void;
};

function SinglePbiTaskList({ tasks, sprintPath, loading, onUpdate, onRemove }: Readonly<TaskListProps>) {
  return (
    <>
      {tasks.map((task, index) => (
        <CopilotTaskRow
          key={`${index}-${task.pbiId}-${task.workingDate}`}
          task={task}
          sprintPath={sprintPath}
          onChange={(next) => onUpdate(index, next)}
          onRemove={() => onRemove(index)}
          disabled={loading}
        />
      ))}
    </>
  );
}

type MultiPbiTaskListProps = TaskListProps & {
  pbiIds: number[];
  groups: Map<number, CreateTaskBatchItem[]>;
};

function MultiPbiTaskList({
  tasks,
  pbiIds,
  groups,
  sprintPath,
  loading,
  onUpdate,
  onRemove,
}: Readonly<MultiPbiTaskListProps>) {
  return (
    <>
      {pbiIds.map((pbiId, groupIdx) => {
        const groupTasks = groups.get(pbiId) ?? [];
        const pbiTitle = groupTasks[0]?.pbiTitle ?? "";
        const groupHours = totalHours(groupTasks);
        const globalIndices = tasks
          .map((t, i) => (t.pbiId === pbiId ? i : -1))
          .filter((i) => i !== -1);

        return (
          <div key={pbiId} className="space-y-3">
            {groupIdx > 0 && <Separator />}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                #{pbiId}
              </Badge>
              <span className="truncate text-sm font-medium">{pbiTitle}</span>
              <span className="text-muted-foreground ml-auto shrink-0 text-xs">{groupHours}h</span>
            </div>
            {groupTasks.map((task, localIdx) => {
              const globalIdx = globalIndices[localIdx]!;
              return (
                <CopilotTaskRow
                  key={`${globalIdx}-${task.pbiId}-${task.workingDate}`}
                  task={task}
                  sprintPath={sprintPath}
                  onChange={(next) => onUpdate(globalIdx, next)}
                  onRemove={() => onRemove(globalIdx)}
                  disabled={loading}
                />
              );
            })}
          </div>
        );
      })}
    </>
  );
}
