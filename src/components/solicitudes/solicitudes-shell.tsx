"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SolicitudesTable } from "@/components/solicitudes/solicitudes-table";
import { SolicitudFormDialog } from "@/components/solicitudes/solicitud-form-dialog";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";

export type SolicitudesShellProps = Readonly<{
  initialSolicitudes: readonly SolicitudDto[];
  projects: readonly string[];
  defaultProject: string;
  currentUserDisplayName: string | null;
  holidayKeys: readonly string[];
  isManagement: boolean;
}>;

export function SolicitudesShell({
  initialSolicitudes,
  projects,
  defaultProject,
  currentUserDisplayName,
  holidayKeys,
  isManagement,
}: SolicitudesShellProps) {
  const [solicitudes, setSolicitudes] = useState<readonly SolicitudDto[]>(initialSolicitudes);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreated = useCallback((created: SolicitudDto) => {
    setSolicitudes((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
  }, []);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <PageHeader
        title="Mis solicitudes"
        description="Registra tus novedades (permisos, incapacidades y más) sin entrar a Azure DevOps."
        action={
          <Button type="button" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Nueva solicitud
          </Button>
        }
      />

      <SolicitudesTable solicitudes={solicitudes} />

      <SolicitudFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={{
          projects,
          defaultProject,
          currentUserDisplayName,
          holidayKeys,
          isManagement,
          onCreated: handleCreated,
        }}
      />
    </div>
  );
}
