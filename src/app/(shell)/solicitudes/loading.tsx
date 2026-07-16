import { Skeleton } from "@/components/ui/skeleton";

type Column = {
  label: string;
  /** Mínimo para que la columna no se aplaste en el esqueleto. */
  cellClassName?: string;
  align?: "left" | "right";
};

const COLUMNS: readonly Column[] = [
  { label: "Tipo", cellClassName: "min-w-[120px]" },
  { label: "Asignado", cellClassName: "min-w-[180px]" },
  { label: "Inicio" },
  { label: "Fin" },
  { label: "Reintegro" },
  { label: "Horas", align: "right" },
  { label: "Días", align: "right" },
  { label: "Estado", align: "right", cellClassName: "min-w-32" },
  { label: "Acciones", align: "right" },
  { label: "Azure", align: "right" },
] as const;

const SKELETON_ROW_KEYS = [
  "skeleton-row-1",
  "skeleton-row-2",
  "skeleton-row-3",
  "skeleton-row-4",
  "skeleton-row-5",
  "skeleton-row-6",
] as const;

export default function SolicitudesLoading() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  className={[
                    "px-3 py-2 font-medium",
                    col.align === "right" ? "text-right" : "text-left",
                    col.cellClassName ?? "",
                  ].join(" ")}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {SKELETON_ROW_KEYS.map((rowKey) => (
              <tr key={rowKey} className="hover:bg-muted/30">
                {COLUMNS.map((col) => (
                  <td
                    key={col.label}
                    className={[
                      "px-3 py-2",
                      col.align === "right" ? "text-right" : "text-left",
                    ].join(" ")}
                  >
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
