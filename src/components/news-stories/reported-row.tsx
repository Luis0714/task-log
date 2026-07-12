import type { ReportedNewsDetail } from "@/lib/azure-devops/list-reported-news";
import {
  ReportedRowDescription,
  ReportedRowHeader,
  ReportedRowMeta,
} from "@/components/news-stories/reported-row-meta";

export type ReportedRowProps = Readonly<{ item: ReportedNewsDetail }>;

/** Una fila individual de la lista de novedades reportadas. Composición
 *  plana: header + título + descripción + meta. Cada sub-bloque vive en su
 *  propio componente testeable (en `reported-row-meta.tsx`). */
export function ReportedRow({ item }: ReportedRowProps) {
  return (
    <li className="border-border/40 flex flex-col gap-1.5 border-t px-4 py-3 first:border-t-0 hover:bg-muted/30 sm:flex-row sm:items-start sm:gap-3">
      <div className="min-w-0 flex-1 space-y-1.5">
        <ReportedRowHeader item={item} />
        <p className="text-sm leading-snug font-medium">{item.title}</p>
        <ReportedRowDescription item={item} />
        <ReportedRowMeta item={item} />
      </div>
    </li>
  );
}
