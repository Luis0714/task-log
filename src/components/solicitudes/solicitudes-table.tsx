"use client";

import { SolicitudesTableSkeleton } from "@/components/solicitudes/solicitudes-table-skeleton";
import { SolicitudesTableHeader } from "@/components/solicitudes/solicitudes-table-header";
import { SolicitudTableCardItem } from "@/components/solicitudes/solicitud-table-card-item";
import { SolicitudTableRowItem } from "@/components/solicitudes/solicitud-table-row-item";
import { useSolicitudesTableView } from "@/hooks/solicitudes/use-solicitudes-table-view";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";

export type SolicitudesTableProps = Readonly<{
  solicitudes: readonly SolicitudDto[];
  project: string;
  onEdit: (solicitud: SolicitudDto) => void;
  onDeleted: (solicitud: SolicitudDto) => void;
  loading?: boolean;
}>;

/**
 * Listado "Mis solicitudes". Móvil = tarjetas apiladas; escritorio = tabla
 * con scroll horizontal. El estado de carga / vacío / poblado lo decide
 * `useSolicitudesTableView` para no duplicar la lógica en este orquestador.
 */
export function SolicitudesTable({
  solicitudes,
  project,
  onEdit,
  onDeleted,
  loading = false,
}: SolicitudesTableProps) {
  const view = useSolicitudesTableView(solicitudes, loading);

  if (view.kind === "loading") {
    return <SolicitudesTableSkeleton />;
  }

  if (view.kind === "empty") {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">Aún no tienes solicitudes registradas.</p>
      </div>
    );
  }

  const data = view.solicitudes;

  return (
    <>
      {/* Móvil: tarjetas apiladas, sin scroll horizontal. */}
      <ul className="space-y-3 md:hidden">
        {data.map((solicitud) => (
          <SolicitudTableCardItem
            key={solicitud.id}
            solicitud={solicitud}
            project={project}
            onEdit={onEdit}
            onDeleted={onDeleted}
          />
        ))}
      </ul>

      {/* Escritorio: tabla; el scroll horizontal es solo respaldo para pantallas muy angostas. */}
      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <SolicitudesTableHeader />
          </thead>
          <tbody className="divide-y">
            {data.map((solicitud) => (
              <SolicitudTableRowItem
                key={solicitud.id}
                solicitud={solicitud}
                project={project}
                onEdit={onEdit}
                onDeleted={onDeleted}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
