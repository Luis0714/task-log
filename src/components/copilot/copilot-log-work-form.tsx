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
import { CopilotLogWorkRow } from "@/components/copilot/copilot-log-work-row";
import type { AzdoAuthMethod } from "@/lib/auth/auth-method";
import type { LogWorkBatch, LogWorkItem } from "@/lib/schemas/agent";

export type CopilotLogWorkFormProps = {
  preview: LogWorkBatch;
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  loading?: boolean;
  onConfirm: (items: LogWorkItem[]) => void;
  onCancel: () => void;
};

function buildEmptyItem(): LogWorkItem {
  return {
    action: "log_work",
    workItemId: 0,
    hours: 1,
    comment: "",
  };
}

export function CopilotLogWorkForm({
  preview,
  adoExecutionReady,
  authMethod: _authMethod,
  loading = false,
  onConfirm,
  onCancel,
}: Readonly<CopilotLogWorkFormProps>) {
  const [items, setItems] = useState<LogWorkItem[]>(preview.items);

  const updateItem = (index: number, next: LogWorkItem) => {
    setItems((current) =>
      current.map((item, i) => (i === index ? next : item)),
    );
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((current) => [...current, buildEmptyItem()]);
  };

  const validCount = items.filter(isValidItem).length;
  const canConfirm = validCount > 0 && !loading && adoExecutionReady;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {items.length === 1
            ? "Vas a registrar tiempo"
            : `Tienes ${items.length} registros para crear`}
        </CardTitle>
        <CardDescription>
          Edita lo que quieras. Las horas se sumarán al Completed Work de cada work item.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="divide-border/60 divide-y">
          {items.map((item, index) => (
            <div
              key={`${index}-${item.workItemId}`}
              className="py-4 first:pt-0 last:pb-0"
            >
              <CopilotLogWorkRow
                item={item}
                onChange={(next) => updateItem(index, next)}
                onRemove={() => removeItem(index)}
                disabled={loading}
              />
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={loading}
          className="w-full"
        >
          <Plus className="size-4" aria-hidden /> Agregar otro registro
        </Button>
      </CardContent>
      <CardFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
        <span className="text-muted-foreground text-xs">
          {validCount} de {items.length} listos para registrar
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
            onClick={() => onConfirm(items)}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="size-4" aria-hidden />
            )}
            {items.length === 1
              ? "Registrar tiempo"
              : `Registrar ${items.length} items`}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function isValidItem(item: LogWorkItem): boolean {
  return (
    item.workItemId > 0 &&
    item.hours > 0 &&
    item.hours <= 24 &&
    item.comment.trim().length > 0
  );
}