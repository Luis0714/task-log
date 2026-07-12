export type ReportsTimeLogEmptyStateProps = {
  message?: string;
};

export function ReportsTimeLogEmptyState({
  message = "No hay datos para los filtros seleccionados.",
}: Readonly<ReportsTimeLogEmptyStateProps>) {
  return (
    <p className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
      {message}
    </p>
  );
}