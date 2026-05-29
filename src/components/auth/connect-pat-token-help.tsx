"use client";

import { ChevronDown } from "lucide-react";

import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function ConnectPatTokenHelp() {
  const copy = CONNECT_ADO_COPY.pat;

  return (
    <Collapsible className="group/pat-help">
      <CollapsibleTrigger
        render={
          <Button
            type="button"
            variant="link"
            className="text-muted-foreground h-auto gap-1 p-0 text-xs font-normal"
          />
        }
      >
        <span>{copy.tokenHelpToggle}</span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform group-data-open/pat-help:rotate-180",
          )}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="text-muted-foreground space-y-2 text-xs leading-relaxed">
          <p>{copy.intro}</p>
          <ol className="list-decimal space-y-1 pl-4">
            {copy.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>{copy.expiryNote}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
