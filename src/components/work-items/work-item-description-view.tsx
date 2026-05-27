"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { cn } from "@/lib/utils";

export type WorkItemDescriptionViewProps = {
  html: string;
  label: string;
  expanded: boolean;
  canToggle: boolean;
  onToggle: () => void;
};

export function WorkItemDescriptionView({
  html,
  label,
  expanded,
  canToggle,
  onToggle,
}: WorkItemDescriptionViewProps) {
  return (
    <>
      <Label className="mt-2">{label}</Label>
      <div className={cn(!expanded && "line-clamp-3 overflow-hidden")}>
        <RichTextContent html={html} className="text-muted-foreground" />
      </div>
      {canToggle ? (
        <Button
          type="button"
          variant="link"
          className="text-primary h-auto px-0 py-0 text-xs font-medium"
          onClick={onToggle}
        >
          {expanded ? "Ver menos" : "Ver más"}
        </Button>
      ) : null}
    </>
  );
}
