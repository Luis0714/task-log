"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type DiffChangeNavProps = Readonly<{
  activeIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}>;

function ChangeNavButton({
  label,
  shortcut,
  disabled,
  onClick,
  children,
}: Readonly<{
  label: string;
  shortcut: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}>) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {label}
        <Kbd>Alt</Kbd>
        <Kbd>{shortcut}</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}

export function DiffChangeNav({
  activeIndex,
  total,
  onPrev,
  onNext,
}: DiffChangeNavProps) {
  const disabled = total === 0;
  const label =
    total === 0
      ? "Sin cambios"
      : activeIndex < 0
        ? `${total} cambios`
        : `${activeIndex + 1} de ${total}`;

  return (
    <div className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border bg-background p-0.5">
      <ChangeNavButton
        label="Cambio anterior"
        shortcut="↑"
        disabled={disabled}
        onClick={onPrev}
      >
        <ChevronUp aria-hidden />
      </ChangeNavButton>
      <span className="whitespace-nowrap px-1.5 text-center text-[11px] tabular-nums text-muted-foreground">
        {label}
      </span>
      <ChangeNavButton
        label="Cambio siguiente"
        shortcut="↓"
        disabled={disabled}
        onClick={onNext}
      >
        <ChevronDown aria-hidden />
      </ChangeNavButton>
    </div>
  );
}
