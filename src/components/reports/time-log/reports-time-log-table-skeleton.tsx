import { Skeleton } from "@/components/ui/skeleton";

const COLUMN_COUNT = 16;
const PLACEHOLDER_ROW_COUNT = 15;

export type ReportsTimeLogTableSkeletonProps = {
  rowCount?: number;
};

export function ReportsTimeLogTableSkeleton({
  rowCount = PLACEHOLDER_ROW_COUNT,
}: Readonly<ReportsTimeLogTableSkeletonProps>) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            {Array.from({ length: COLUMN_COUNT }).map((_, idx) => (
              <th key={`hdr-${idx}`} className="bg-background px-3 py-2 text-left">
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }, (_, i) => `skeleton-row-${i}`).map(
            (rowKey) => (
              <tr key={rowKey} className="border-b last:border-b-0">
                {Array.from({ length: COLUMN_COUNT }).map((_, cIdx) => (
                  <td key={`cell-${cIdx}`} className="px-3 py-2">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
