"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { htmlToPlainText } from "@/lib/html/html-to-plain-text";
import { cn } from "@/lib/utils";

const MIN_CHARS_FOR_TOGGLE = 120;

export type WorkItemDescriptionBlockProps = {
  html: string;
  label?: string;
};

export function WorkItemDescriptionBlock({
  html,
  label = "Descripcion",
}: WorkItemDescriptionBlockProps) {
  const [expanded, setExpanded] = useState(false);

  const plainPreview = useMemo(() => htmlToPlainText(html), [html]);
  const canToggle = plainPreview.length > MIN_CHARS_FOR_TOGGLE;

  useEffect(() => {
    setExpanded(false);
  }, [html]);

  if (!plainPreview) return null;

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
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Ver menos" : "Ver más"}
        </Button>
      ) : null}
    </>
  );
}
