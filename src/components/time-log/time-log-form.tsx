"use client";

import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";

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
import { useAdoSprintWorkItems } from "@/hooks/use-ado-sprint-work-items";
import { useAdoSprints } from "@/hooks/use-ado-sprints";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";
import {
  formatSprintOptionLabel,
  formatWorkItemOptionLabel,
} from "@/lib/time-log/format-options";

export type TimeLogFormProps = {
  form: UseFormReturn<TimeLogFormValues>;
  adoExecutionReady: boolean;
  loading?: boolean;
  onSubmit: () => void;
};

export function TimeLogForm({
  form,
  adoExecutionReady,
  loading = false,
  onSubmit,
}: TimeLogFormProps) {
  const sprintPath = form.watch("sprintPath");
  const {
    sprints,
    loading: sprintsLoading,
    error: sprintsError,
  } = useAdoSprints(adoExecutionReady);
  const {
    workItems,
    loading: workItemsLoading,
    error: workItemsError,
  } = useAdoSprintWorkItems(sprintPath || undefined, adoExecutionReady);

  useEffect(() => {
    if (!adoExecutionReady || sprintsLoading || sprints.length === 0) return;
    if (form.getValues("sprintPath")) return;

    const preferred =
      sprints.find((sprint) => sprint.timeFrame === "current") ?? sprints[0];
    form.setValue("sprintPath", preferred.path, { shouldValidate: true });
  }, [adoExecutionReady, form, sprints, sprintsLoading]);

  const catalogDisabled = loading || !adoExecutionReady;
  const workItemSelectDisabled =
    catalogDisabled || !sprintPath || workItemsLoading || sprintsLoading;

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
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
                  form.setValue("workItemId", "");
                  form.clearErrors("workItemId");
                }}
                disabled={catalogDisabled || sprintsLoading}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        sprintsLoading
                          ? "Cargando sprints..."
                          : adoExecutionReady
                            ? "Selecciona un sprint"
                            : "Conecta Azure DevOps para ver sprints"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.path}>
                      {formatSprintOptionLabel(sprint)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sprintsError && (
                <p className="text-destructive text-xs">{sprintsError}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

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
                disabled={workItemSelectDisabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        !sprintPath
                          ? "Primero elige un sprint"
                          : workItemsLoading
                            ? "Cargando work items..."
                            : workItems.length === 0
                              ? "Sin work items en este sprint"
                              : "Selecciona un work item"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {workItems.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {formatWorkItemOptionLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {workItemsError && (
                <p className="text-destructive text-xs">{workItemsError}</p>
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
