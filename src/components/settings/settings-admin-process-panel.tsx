"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";

import { SettingsFieldRow } from "@/components/settings/settings-field-row";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsAdminProcessProfile } from "@/hooks/settings/use-settings-admin-process-profile";
import type { SettingsPageData } from "@/lib/settings/load-settings-page-data";
import {
  ACTIVITY_FIELD_COPY,
  ADMIN_PROCESS_SECTION,
  BACKLOG_WIT_COPY,
  BUG_WIT_COPY,
  COMPLETED_WORK_FIELD_COPY,
  ORIGINAL_ESTIMATE_FIELD_COPY,
  TASK_DONE_STATE_COPY,
  TASK_TODO_STATE_COPY,
  TASK_WIT_COPY,
  TIMEZONE_FIELD_COPY,
  WORKING_DATE_FIELD_COPY,
} from "@/lib/settings/settings-field-copy";

export type SettingsAdminProcessPanelProps = {
  data: SettingsPageData;
};

export function SettingsAdminProcessPanel({ data }: SettingsAdminProcessPanelProps) {
  const {
    profile,
    options,
    workingDateField,
    setWorkingDateField,
    timezone,
    setTimezone,
    completedWorkField,
    setCompletedWorkField,
    originalEstimateField,
    setOriginalEstimateField,
    activityField,
    setActivityField,
    taskWorkItemType,
    setTaskWorkItemType,
    bugWorkItemType,
    setBugWorkItemType,
    backlogItemType,
    setBacklogItemType,
    taskTodoState,
    setTaskTodoState,
    taskDoneState,
    setTaskDoneState,
    busy,
    isDirty,
    save,
    rediscover,
  } = useSettingsAdminProcessProfile({
    project: data.connection.project,
    initialProfile: data.profile,
    initialOptions: data.taskDateFieldOptions,
  });

  const dateFieldOptions = useMemo(() => {
    if (options.some((option) => option.referenceName === workingDateField)) {
      return options;
    }
    return [{ referenceName: workingDateField, label: workingDateField }, ...options];
  }, [options, workingDateField]);

  const selectedOption = dateFieldOptions.find(
    (option) => option.referenceName === workingDateField,
  );

  const taskStates = data.taskStates ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ADMIN_PROCESS_SECTION.title}</CardTitle>
        <CardDescription>{ADMIN_PROCESS_SECTION.description}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        <SettingsFieldRow
          copy={WORKING_DATE_FIELD_COPY}
          source={profile.workingDateFieldSource}
          referenceName={workingDateField}
        >
          <Select
            value={workingDateField || null}
            onValueChange={(value) => {
              if (value) setWorkingDateField(value);
            }}
            disabled={busy !== null}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elige un campo de fecha">
                {selectedOption?.label ?? workingDateField}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {dateFieldOptions.map((option) => (
                <SelectItem key={option.referenceName} value={option.referenceName}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsFieldRow>

        <SettingsFieldRow copy={TIMEZONE_FIELD_COPY}>
          <Input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="America/Bogota"
            disabled={busy !== null}
            spellCheck={false}
          />
        </SettingsFieldRow>

        <SettingsFieldRow copy={COMPLETED_WORK_FIELD_COPY}>
          <Input
            value={completedWorkField}
            onChange={(e) => setCompletedWorkField(e.target.value)}
            placeholder="Microsoft.VSTS.Scheduling.CompletedWork"
            disabled={busy !== null}
            spellCheck={false}
          />
        </SettingsFieldRow>

        <SettingsFieldRow copy={ORIGINAL_ESTIMATE_FIELD_COPY}>
          <Input
            value={originalEstimateField}
            onChange={(e) => setOriginalEstimateField(e.target.value)}
            placeholder="Microsoft.VSTS.Scheduling.OriginalEstimate"
            disabled={busy !== null}
            spellCheck={false}
          />
        </SettingsFieldRow>

        <SettingsFieldRow copy={ACTIVITY_FIELD_COPY}>
          <Input
            value={activityField}
            onChange={(e) => setActivityField(e.target.value)}
            placeholder="Microsoft.VSTS.Common.Activity (vacío = desactivado)"
            disabled={busy !== null}
            spellCheck={false}
          />
        </SettingsFieldRow>

        <SettingsFieldRow copy={TASK_WIT_COPY}>
          <Input
            value={taskWorkItemType}
            onChange={(e) => setTaskWorkItemType(e.target.value)}
            placeholder="Task"
            disabled={busy !== null}
            spellCheck={false}
          />
        </SettingsFieldRow>

        <SettingsFieldRow copy={BUG_WIT_COPY}>
          <Input
            value={bugWorkItemType}
            onChange={(e) => setBugWorkItemType(e.target.value)}
            placeholder="Bug"
            disabled={busy !== null}
            spellCheck={false}
          />
        </SettingsFieldRow>

        <SettingsFieldRow copy={BACKLOG_WIT_COPY}>
          <Input
            value={backlogItemType}
            onChange={(e) => setBacklogItemType(e.target.value)}
            placeholder="Product Backlog Item"
            disabled={busy !== null}
            spellCheck={false}
          />
        </SettingsFieldRow>

        {taskStates.length > 0 && (
          <SettingsFieldRow copy={TASK_TODO_STATE_COPY}>
            <Select
              value={taskTodoState || undefined}
              onValueChange={(v) => { if (v) setTaskTodoState(v); }}
              disabled={busy !== null}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Estado inicial" />
              </SelectTrigger>
              <SelectContent>
                {taskStates.map((state) => (
                  <SelectItem key={state.name} value={state.name}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsFieldRow>
        )}

        {taskStates.length > 0 && (
          <SettingsFieldRow copy={TASK_DONE_STATE_COPY}>
            <Select
              value={taskDoneState || undefined}
              onValueChange={(v) => { if (v) setTaskDoneState(v); }}
              disabled={busy !== null}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Estado completado" />
              </SelectTrigger>
              <SelectContent>
                {taskStates.map((state) => (
                  <SelectItem key={state.name} value={state.name}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsFieldRow>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t">
        <Button type="button" onClick={() => void save()} disabled={busy !== null || !isDirty}>
          {busy === "save" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Guardar configuración
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void rediscover()}
          disabled={busy !== null}
        >
          {busy === "rediscover" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Re-detectar desde Azure DevOps
        </Button>
      </CardFooter>
    </Card>
  );
}
