"use client";

import { useMemo } from "react";

import { normalizeAdoRichText } from "@/lib/html/markdown-to-html";
import { rewriteAdoImgSrcsForDisplay } from "@/lib/html/rewrite-ado-image-urls";
import { sanitizeRichTextHtml } from "@/lib/html/sanitize-rich-text-html";
import { cn } from "@/lib/utils";

type RichTextContentProps = {
  html: string;
  className?: string;
};

export function RichTextContent({ html, className }: RichTextContentProps) {
  const safeHtml = useMemo(
    () =>
      // 1) Markdown → HTML cuando el campo llega en markdown (p.ej. Repro Steps
      //    en procesos donde el campo es plain-text).
      // 2) Sanitizar el HTML resultante con DOMPurify.
      // 3) Re-enrutar las imágenes hospedadas en `dev.azure.com/.../attachments/`
      //    a través del proxy local con auth (`/api/ado/attachments/proxy`).
      rewriteAdoImgSrcsForDisplay(sanitizeRichTextHtml(normalizeAdoRichText(html))),
    [html],
  );

  return (
    <div
      className={cn(
        "text-foreground/80 text-sm leading-relaxed",
        "[&_p]:mb-2 [&_p:last-child]:mb-0",
        "[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2",
        "[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2",
        "[&_li]:mb-0.5",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_em]:italic",
        "[&_a]:text-primary [&_a]:underline",
        "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
        "[&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-3",
        "[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3",
        "[&_img]:mt-2 [&_img]:max-w-full [&_img]:rounded [&_img]:border [&_img]:border-border/60",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
