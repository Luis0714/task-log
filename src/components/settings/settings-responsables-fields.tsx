"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdoProcessProfileResponsableField } from "@/lib/azure-devops/process-profile-types";

export type SettingsResponsablesFieldsProps = {
  fields: readonly AdoProcessProfileResponsableField[];
  /** Candidatos del proceso (label + referenceName) para auto-detectar. */
  candidates: ReadonlyArray<{ referenceName: string; name: string }>;
  onChange: (next: AdoProcessProfileResponsableField[]) => void;
  onDetectFromAzure?: () => Promise<void> | void;
  detecting?: boolean;
};

export function SettingsResponsablesFields({
  fields,
  candidates,
  onChange,
  onDetectFromAzure,
  detecting = false,
}: SettingsResponsablesFieldsProps) {
  const updateAt = (idx: number, patch: Partial<AdoProcessProfileResponsableField>) => {
    onChange(
      fields.map((f, i) =>
        i === idx
          ? {
              ...f,
              ...patch,
              // Mantener key sincronizada con referenceName cuando esta última cambia.
              key: patch.referenceName ?? f.key,
            }
          : f,
      ),
    );
  };

  const removeAt = (idx: number) => {
    onChange(fields.filter((_, i) => i !== idx));
  };

  const addFromCandidate = (referenceName: string) => {
    const candidate = candidates.find((c) => c.referenceName === referenceName);
    if (!candidate) return;
    if (fields.some((f) => f.referenceName === referenceName)) return;
    onChange([
      ...fields,
      {
        key: candidate.referenceName,
        referenceName: candidate.referenceName,
        label: candidate.name,
        defaultToCurrentUser: true,
      },
    ]);
  };

  const addBlank = () => {
    onChange([
      ...fields,
      {
        key: `Custom.Responsable${fields.length + 1}`,
        referenceName: `Custom.Responsable${fields.length + 1}`,
        label: "",
        defaultToCurrentUser: true,
      },
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Responsables del PBI</CardTitle>
        <CardDescription>
          Campos &laquo;Responsable&raquo; requeridos por el proceso al cambiar de
          estado (p. ej. QA). Si dejas vacíos los marcados con &laquo;Asignarme por defecto&raquo;,
          la plataforma rellenará con tu usuario al cambiar de estado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[180px]">
            <Label htmlFor="settings-responsable-candidate">
              Auto-detectar desde Azure
            </Label>
            <Select onValueChange={(value) => addFromCandidate(String(value))}>
              <SelectTrigger id="settings-responsable-candidate" className="w-full">
                <SelectValue placeholder="Elegir candidato del proceso" />
              </SelectTrigger>
              <SelectContent>
                {candidates
                  .filter((c) => !fields.some((f) => f.referenceName === c.referenceName))
                  .map((c) => (
                    <SelectItem key={c.referenceName} value={c.referenceName}>
                      {c.name} ({c.referenceName})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {onDetectFromAzure ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void onDetectFromAzure()}
              disabled={detecting}
            >
              {detecting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Re-detectar candidatos
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={addBlank}>
            <Plus className="size-4" aria-hidden /> Añadir manualmente
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-sm">
            Aún no hay Responsables configurados. Usa el selector o añádelos manualmente.
          </p>
        ) : (
          <ul className="space-y-3">
            {fields.map((field, idx) => (
              <li
                key={`${field.referenceName}-${idx}`}
                className="grid grid-cols-1 gap-3 rounded-lg border p-3 md:grid-cols-[2fr_2fr_auto_auto]"
              >
                <div className="space-y-1">
                  <Label htmlFor={`responsable-label-${idx}`}>Etiqueta visible</Label>
                  <Input
                    id={`responsable-label-${idx}`}
                    value={field.label}
                    placeholder="Responsable Maquetación"
                    onChange={(e) => updateAt(idx, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`responsable-ref-${idx}`}>Reference Name</Label>
                  <Input
                    id={`responsable-ref-${idx}`}
                    value={field.referenceName}
                    placeholder="Custom.ResponsableMaquetacion"
                    onChange={(e) => updateAt(idx, { referenceName: e.target.value.trim() })}
                    spellCheck={false}
                  />
                </div>
                <label className="flex items-center gap-2 self-end pb-2">
                  <Checkbox
                    checked={field.defaultToCurrentUser}
                    onCheckedChange={(checked) =>
                      updateAt(idx, { defaultToCurrentUser: Boolean(checked) })
                    }
                  />
                  <span className="text-sm">Asignarme por defecto</span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="self-end"
                  onClick={() => removeAt(idx)}
                  aria-label={`Quitar ${field.label || field.referenceName}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}