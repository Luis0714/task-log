"use client";

import { WorkItemDescriptionView } from "@/components/work-items/work-item-description-view";
import { useExpandableRichText } from "@/hooks/work-items/use-expandable-rich-text";

export type WorkItemDescriptionBlockProps = {
  html: string;
  label?: string;
};

export function WorkItemDescriptionBlock({
  html,
  label = "Descripcion",
}: WorkItemDescriptionBlockProps) {
  const { expanded, canToggle, hasContent, toggle } = useExpandableRichText({ html });

  if (!hasContent) return null;

  return (
    <WorkItemDescriptionView
      html={html}
      label={label}
      expanded={expanded}
      canToggle={canToggle}
      onToggle={toggle}
    />
  );
}
