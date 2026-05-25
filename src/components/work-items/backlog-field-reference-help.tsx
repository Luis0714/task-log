"use client";

import { useState } from "react";

import type { AdoBacklogFieldsResponseDto } from "@/lib/schemas/ado-backlog-fields";
import { cn } from "@/lib/utils";

export type BacklogFieldReferenceHelpProps = {
  metadata: AdoBacklogFieldsResponseDto | null;
  loading?: boolean;
  className?: string;
};

export function BacklogFieldReferenceHelp({
  metadata,
  loading = false,
  className,
}: BacklogFieldReferenceHelpProps) {
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <p className={cn("text-muted-foreground text-xs", className)}>
        Cargando nombres de campos en Azure DevOps…
      </p>
    );
  }

  if (!metadata) return null;

  return (
    <section className={cn("rounded-lg border border-dashed px-3 py-3", className)}>
      <button
        type="button"
        className="text-foreground flex w-full items-center justify-between text-left text-sm font-medium"
        onClick={() => setOpen((value) => !value)}
      >
        ¿Cómo encontrar el Reference Name?
        <span className="text-muted-foreground text-xs">{open ? "Ocultar" : "Ver"}</span>
      </button>

      {open ? (
        <div className="text-muted-foreground mt-3 space-y-3 text-xs leading-relaxed">
          <ol className="list-decimal space-y-1.5 pl-4">
            <li>
              En Azure DevOps: <strong className="text-foreground">Project settings</strong> →{" "}
              <strong className="text-foreground">Project configuration</strong> →{" "}
              <strong className="text-foreground">Process</strong> (o heredado de la organización).
            </li>
            <li>
              Abre el tipo <strong className="text-foreground">{metadata.workItemType}</strong> → pestaña{" "}
              <strong className="text-foreground">Fields</strong>.
            </li>
            <li>
              Haz clic en el campo (p. ej. Responsable Maquetación). El{" "}
              <strong className="text-foreground">Reference name</strong> aparece en el detalle (suele ser{" "}
              <code className="text-foreground">Custom.Algo</code>).
            </li>
            <li>
              Cópialo en <code className="text-foreground">.env.local</code> como{" "}
              <code className="text-foreground">AZDO_PBI_FIELD_MAQUETACION=...</code> y reinicia la app.
            </li>
          </ol>

          {metadata.fields.length > 0 ? (
            <div>
              <p className="text-foreground mb-1.5 font-medium">Campos que usa esta app</p>
              <ul className="space-y-1">
                {metadata.fields.map((field) => (
                  <li key={field.key} className="font-mono text-[11px] break-all">
                    {field.label}: {field.referenceName}{" "}
                    <span className="text-muted-foreground font-sans">
                      ({field.source === "env" ? "env" : "detectado"})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-amber-700 dark:text-amber-400">
              Aún no se detectaron los tres responsables. Revisa la lista de candidatos o configura el
              .env manualmente.
            </p>
          )}

          {metadata.responsableCandidates.length > 0 ? (
            <div>
              <p className="text-foreground mb-1.5 font-medium">
                Campos con “Responsable” en tu proceso
              </p>
              <ul className="max-h-32 space-y-1 overflow-y-auto">
                {metadata.responsableCandidates.map((candidate) => (
                  <li key={candidate.referenceName} className="font-mono text-[11px] break-all">
                    {candidate.name} → {candidate.referenceName}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
