import { Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type ReportsTimeLogNewsNotConfiguredAlertProps = {
  message: string;
};

export function ReportsTimeLogNewsNotConfiguredAlert({
  message,
}: Readonly<ReportsTimeLogNewsNotConfiguredAlertProps>) {
  return (
    <Alert>
      <Info className="size-4" aria-hidden />
      <AlertTitle>Sin HU de novedades configuradas</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}