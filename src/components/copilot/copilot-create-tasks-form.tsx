"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopilotTaskRow } from "@/components/copilot/copilot-task-row";
import type { AzdoAuthMethod } from "@/lib/auth/auth-method";
import type {
  CreateTaskBatchItem,
  CreateTasksBatch,
} from "@/lib/schemas/agent";

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

function buildEmptyTask(sprintPath: string, team: string): CreateTaskBatchItem {
  return {
    pbiId: 0,
    pbiTitle: "",
    title: "",
    hours: 1,
    description: "",
    activity: "Development",
    workingDate: "",
    workingTime: "09:00",
    state: "Closed",
    markAsDone: true,
    sprintPath,
    team,
  };
}

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
    preview.tasks.map(normalizeTask),
  );

  const updateTask = (index: number, next: CreateTaskBatchItem) => {
    setTasks((current) =>
      current.map((task, i) => (i === index ? next : task)),
    );
  };

  const removeTask = (index: number) => {
    setTasks((current) => current.filter((_, i) => i !== index));
  };

  const addTask = () => {
    setTasks((current) => [...current, buildEmptyTask(sprintPath, team)]);
  };

  const validCount = tasks.filter(isValidTask).length;
  const canConfirm = validCount > 0 && !loading && adoExecutionReady;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Tienes {tasks.length} task{tasks.length === 1 ? "" : "s"} para crear
        </CardTitle>
        <CardDescription>
          Edita lo que quieras. Cuando esté listo, se crearán como Done.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task, index) => (
          <CopilotTaskRow
            key={`${index}-${task.pbiId}-${task.workingDate}`}
            task={task}
            sprintPath={sprintPath}
            onChange={(next) => updateTask(index, next)}
            onRemove={() => removeTask(index)}
            disabled={loading}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTask}
          disabled={loading}
          className="w-full"
        >
          <Plus className="size-4" aria-hidden /> Agregar otra task
        </Button>
      </CardContent>
      <CardFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
        <span className="text-muted-foreground text-xs">
          {validCount} de {tasks.length} listas para crear
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(tasks)}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="size-4" aria-hidden />
            )}
            {tasks.length === 1
              ? "Crear task"
              : `Crear ${tasks.length} tasks`}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function normalizeTask(task: CreateTaskBatchItem): CreateTaskBatchItem {
  return {
    ...task,
    markAsDone: true,
  };
}

function isValidTask(task: CreateTaskBatchItem): boolean {
  return (
    task.pbiId > 0 &&
    task.title.trim().length > 0 &&
    task.description.trim().length > 0 &&
    task.hours > 0 &&
    task.hours <= 24 &&
    /^\d{4}-\d{2}-\d{2}$/.test(task.workingDate) &&
    /^\d{2}:\d{2}$/.test(task.workingTime) &&
    task.activity.trim().length > 0 &&
    task.state.trim().length > 0
  );
}