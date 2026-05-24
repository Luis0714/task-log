"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { parseAdoError } from "@/lib/errors/parse-ado-error";

export type CopilotErrorAlertProps = {
  message: string;
};

export function CopilotErrorAlert({ message }: CopilotErrorAlertProps) {
  const { summary, detail } = parseAdoError(message);

  return (
    <Alert variant="destructive" className="min-w-0 max-w-full overflow-hidden">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="min-w-0 max-w-full overflow-hidden break-words">
        <p className="line-clamp-3">{summary}</p>
        {detail && detail !== summary ? (
          <p
            className="text-muted-foreground mt-2 max-h-28 overflow-y-auto text-xs leading-relaxed break-words whitespace-pre-wrap"
            title={detail}
          >
            {detail}
          </p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
