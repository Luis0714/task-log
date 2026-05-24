"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type CopilotErrorAlertProps = {
  message: string;
};

export function CopilotErrorAlert({ message }: CopilotErrorAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
