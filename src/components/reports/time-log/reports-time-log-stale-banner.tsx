import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ReportsTimeLogStaleBanner() {
  return (
    <Alert className="bg-secondary">
      <div className="flex w-full items-center gap-2">
      <AlertTitle>Reporte desactualizado</AlertTitle>
      </div>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>Cambiaste los filtros. <strong>Actualiza el reporte</strong> para ver los datos actualizados.</span>
      </AlertDescription>
    </Alert>
  );
}