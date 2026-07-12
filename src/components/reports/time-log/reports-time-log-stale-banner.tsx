import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type ReportsTimeLogStaleBannerProps = {
  onRegenerate: () => void;
  regenerating: boolean;
};

export function ReportsTimeLogStaleBanner({
  onRegenerate,
  regenerating,
}: Readonly<ReportsTimeLogStaleBannerProps>) {
  return (
    <Alert>
      <AlertTitle>Reporte desactualizado</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>Cambiaste los filtros. Regenera el reporte para ver los datos actualizados.</span>
        <Button size="sm" onClick={onRegenerate} disabled={regenerating}>
          {regenerating ? "Regenerando..." : "Regenerar"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}