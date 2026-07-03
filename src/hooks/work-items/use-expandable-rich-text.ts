"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { htmlToPlainText } from "@/lib/html/html-to-plain-text";

const DEFAULT_MIN_CHARS_FOR_TOGGLE = 120;

export type UseExpandableRichTextOptions = {
  html: string;
  minCharsForToggle?: number;
};

export function useExpandableRichText({
  html,
  minCharsForToggle = DEFAULT_MIN_CHARS_FOR_TOGGLE,
}: UseExpandableRichTextOptions) {
  const [expanded, setExpanded] = useState(false);

  const plainText = useMemo(() => htmlToPlainText(html), [html]);
  const hasContent = plainText.length > 0;
  const canToggle = plainText.length > minCharsForToggle;

  useEffect(() => {
    setExpanded(false);
  }, [html]);

  const toggle = useCallback(() => {
    setExpanded((current) => !current);
  }, []);

  return {
    expanded,
    canToggle,
    hasContent,
    toggle,
  };
}
