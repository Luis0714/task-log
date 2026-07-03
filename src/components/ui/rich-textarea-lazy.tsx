"use client";

import dynamic from "next/dynamic";

function RichTextareaFallback() {
  return (
    <div
      aria-hidden
      className="border-input min-h-[158px] rounded-md border bg-transparent shadow-xs"
    />
  );
}

/**
 * Versión con carga diferida del editor: tiptap/ProseMirror pesan cientos de KB
 * y no deben formar parte del bundle inicial de las páginas que usan el campo.
 */
export const RichTextarea = dynamic(
  () => import("@/components/ui/rich-textarea").then((mod) => mod.RichTextarea),
  { ssr: false, loading: RichTextareaFallback },
);
