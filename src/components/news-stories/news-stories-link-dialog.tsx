"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { PbiSelectComboboxField } from "@/components/time-log/fields/pbi-select-combobox-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { appToast } from "@/lib/toast";

export type NewsStoriesLinkDialogProps = Readonly<{
  /** Backlog del proyecto — mismo origen que `/time-log` "Backlog completo". */
  pbis: ReadonlyArray<AdoWorkItemOptionDto>;
  /** True cuando todavía no hay scope listo (proyecto sin elegir) o el backlog está cargando. */
  scopeReady: boolean;
  /** True mientras la mutación de `link` está en curso (deshabilita los botones). */
  saving: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Llamada que persiste el link. El servidor devuelve 409 si la HU ya está
   * vinculada al (proyecto, equipo) actual; ese error se muestra como toast y
   * el diálogo permanece abierto para que el admin pueda intentarlo con otra
   * HU o cambiar de equipo.
   */
  onConfirm: (item: AdoWorkItemOptionDto) => Promise<{ ok: boolean; message?: string }>;
}>;

/**
 * Diálogo "Vincular HU" para `/admin/novedades`.
 *
 * Reutiliza el `PbiSelectComboboxField` del flujo de `/time-log` y del diálogo
 * "Cambiar HU" de `/tasks` — único punto del backlog que conoce la app.
 *
 * La selección se confirma desde el footer (no en `onValueChange`) para
 * reservar un único punto de mutación visible para el usuario.
 */
export function NewsStoriesLinkDialog({
  pbis,
  scopeReady,
  saving,
  open,
  onOpenChange,
  onConfirm,
}: NewsStoriesLinkDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedItem = useMemo<AdoWorkItemOptionDto | null>(() => {
    if (!selectedId) return null;
    return pbis.find((item) => String(item.id) === selectedId) ?? null;
  }, [pbis, selectedId]);

  // Reset interno cada vez que el diálogo se cierra o cambia el universo de
  // opciones, para no arrastrar selecciones inválidas si el admin cierra y
  // reabre.
  useEffect(() => {
    if (!open) setSelectedId(null);
  }, [open, pbis]);

  const nothingToLink = scopeReady && !saving && pbis.length === 0;

  const handleConfirm = async () => {
    if (!selectedItem) return;
    const result = await onConfirm(selectedItem);
    if (result.ok) {
      appToast.success("HU vinculada.");
      onOpenChange(false);
    } else {
      appToast.error(result.message ?? "No se pudo vincular la HU.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Vincular HU de novedad</DialogTitle>
          <DialogDescription>
            Busca la HU del backlog que el reporte reconocerá como novedad en
            este (Proyecto, Equipo).
          </DialogDescription>
        </DialogHeader>

        {scopeReady ? (
          <PbiSelectComboboxField
            pbis={pbis}
            value={selectedId}
            onValueChange={setSelectedId}
            disabled={saving}
            placeholder={
              nothingToLink
                ? "Sin HUs disponibles"
                : "Selecciona una HU del backlog"
            }
            searchPlaceholder="Buscar por título o ID…"
            emptyMessage="Sin historias que coincidan."
          />
        ) : (
          <Skeleton className="h-9 w-full rounded-lg" />
        )}

        <DialogFooter>
          <DialogClose
            render={
              <Button
                type="button"
                variant="outline"
                disabled={saving}
              />
            }
          >
            Cancelar
          </DialogClose>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={saving || !selectedItem}
          >
            <Plus className="size-3.5" aria-hidden />
            {saving ? "Vinculando…" : "Vincular"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
