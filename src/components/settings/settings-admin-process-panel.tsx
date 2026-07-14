"use client";

import { Loader2 } from "lucide-react";

import { SettingsFieldRow } from "@/components/settings/settings-field-row";
import { SettingsProcessBaseRows } from "@/components/settings/settings-process-base-rows";
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
import { SettingsResponsablesFields } from "@/components/settings/settings-responsables-fields";
import type { SettingsPageData } from "@/lib/settings/load-settings-page-data";
import {
  ACTIVITY_FIELD_COPY,
  ADMIN_PROCESS_SECTION,
  BACKLOG_WIT_COPY,
  BUG_WIT_COPY,
  COMPLETED_WORK_FIELD_COPY,
  ORIGINAL_ESTIMATE_FIELD_COPY,
  REMAINING_WORK_FIELD_COPY,
  TASK_DONE_STATE_COPY,
  TASK_TODO_STATE_COPY,
  TASK_WIT_COPY,
} from "@/lib/settings/settings-field-copy";

export type SettingsAdminProcessPanelProps = {
  data: SettingsPageData;
};

export function SettingsAdminProcessPanel({ data }: Readonly<SettingsAdminProcessPanelProps>) {
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
    remainingWorkField,
    setRemainingWorkField,
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
    responsableFields,
    setResponsableFields,
    responsableCandidates,
    detectResponsables,
    detectingResponsables,
    busy,
    isDirty,
    save,
    rediscover,
  } = useSettingsAdminProcessProfile({
    project: data.connection.project,
    initialProfile: data.profile,
    initialOptions: data.taskDateFieldOptions,
  });

  const taskStates = data.taskStates ?? [];

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>{ADMIN_PROCESS_SECTION.title}</CardTitle>
        <CardDescription>{ADMIN_PROCESS_SECTION.description}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        <SettingsProcessBaseRows
          workingDateField={workingDateField}
          onWorkingDateFieldChange={setWorkingDateField}
          workingDateFieldSource={profile.workingDateFieldSource}
          options={options}
          timezone={timezone}
          onTimezoneChange={setTimezone}
          disabled={busy !== null}
        />

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

        <SettingsFieldRow copy={REMAINING_WORK_FIELD_COPY}>
          <Input
            value={remainingWorkField}
            onChange={(e) => setRemainingWorkField(e.target.value)}
            placeholder="Microsoft.VSTS.Scheduling.RemainingWork (vacío = desactivado)"
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
              value={taskTodoState || null}
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
              value={taskDoneState || null}
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

    <SettingsResponsablesFields
      fields={responsableFields}
      candidates={responsableCandidates}
      onChange={setResponsableFields}
      onDetectFromAzure={detectResponsables}
      detecting={detectingResponsables}
    />
  </div>
  );
}
