"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
};

/** Isotipo: arco de ruta + marca “T” — evoca piloto/guía de tareas. */
export function LogoMark({ className }: LogoMarkProps) {
  const gradientId = `tp-mark-${useId().replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8 shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="28" y2="28">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path
        d="M9 11.5C12.5 8 19.5 8 23 11.5"
        stroke="white"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11 22V13.5H21M11 17H18"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23" cy="11.5" r="1.75" fill="white" />
    </svg>
  );
}
