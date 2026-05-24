"use client";

import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { WorkItemFiltersPanel } from "@/components/time-log/work-item-filters-panel";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TimeLogCatalog } from "@/hooks/use-time-log-catalog";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";
import {
  formatSprintOptionLabel,
  formatWorkItemOptionLabel,
} from "@/lib/time-log/format-options";

export type TimeLogFormProps = {
  form: UseFormReturn<TimeLogFormValues>;
  catalog: TimeLogCatalog;
  adoExecutionReady: boolean;
  loading?: boolean;
  onSubmit: () => void;
};

export function TimeLogForm({
  form,
  catalog,
  adoExecutionReady,
  loading = false,
  onSubmit,
}: TimeLogFormProps) {
  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="project"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proyecto</FormLabel>
              <Select
                value={field.value || null}
                onValueChange={(value) => {
                  if (!value) return;
                  field.onChange(value);
                  catalog.onProjectChange();
                }}
                disabled={catalog.projectSelectDisabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={catalog.placeholders.project} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {catalog.projects.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {catalog.projectsError && (
                <p className="text-destructive text-xs">{catalog.projectsError}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="team"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipo</FormLabel>
              <Select
                value={field.value || null}
                onValueChange={(value) => {
                  if (!value) return;
                  field.onChange(value);
                  catalog.onTeamChange();
                }}
                disabled={catalog.teamSelectDisabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={catalog.placeholders.team} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {catalog.teams.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {catalog.teamsError && (
                <p className="text-destructive text-xs">{catalog.teamsError}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sprintPath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sprint</FormLabel>
              <Select
                value={field.value || null}
                onValueChange={(value) => {
                  if (!value) return;
                  field.onChange(value);
                  catalog.onSprintChange();
                }}
                disabled={catalog.sprintSelectDisabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={catalog.placeholders.sprint}>
                      {catalog.selectedSprintLabel}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {catalog.sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.path}>
                      {formatSprintOptionLabel(sprint)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {catalog.sprintsError && (
                <p className="text-destructive text-xs">{catalog.sprintsError}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {catalog.sprintPath && (
          <WorkItemFiltersPanel
            filters={catalog.workItemFilters}
            states={catalog.workItemStates}
            filteredCount={catalog.workItemsFilteredCount}
            totalCount={catalog.workItemsTotalCount}
            disabled={catalog.catalogDisabled || catalog.workItemsLoading || !catalog.sprintPath}
            onSearchChange={catalog.onWorkItemSearchChange}
            onAssignedToMeChange={catalog.onWorkItemAssignedToMeChange}
            onStateChange={catalog.onWorkItemStateChange}
          />
        )}

        <FormField
          control={form.control}
          name="workItemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work item</FormLabel>
              <Select
                value={field.value || null}
                onValueChange={(value) => {
                  if (!value) return;
                  field.onChange(value);
                }}
                disabled={catalog.workItemSelectDisabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={catalog.placeholders.workItem}>
                      {catalog.selectedWorkItemLabel}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {catalog.workItems.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {formatWorkItemOptionLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {catalog.workItemsError && (
                <p className="text-destructive text-xs">{catalog.workItemsError}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horas</FormLabel>
              <FormControl>
                <Input
                  inputMode="decimal"
                  placeholder="1.5"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comentario</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Qué hiciste en este work item"
                  rows={3}
                  disabled={loading}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={loading || !adoExecutionReady}
          className="min-h-10 w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          Revisar y registrar
        </Button>
      </form>
    </Form>
  );
}

export function TimeLogCopilotLink() {
  return (
    <p className="text-muted-foreground text-sm">
      ¿Prefieres lenguaje natural?{" "}
      <Link href="/copilot" className="text-primary font-medium hover:underline">
        Usa el Copiloto IA
      </Link>
    </p>
  );
}
