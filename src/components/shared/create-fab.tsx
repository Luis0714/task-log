"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CreateFabProps = {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
};

export function CreateFab({ label, icon, onClick, className }: CreateFabProps) {
  return (
    <Button
      type="button"
      size="lg"
      onClick={onClick}
      className={cn(
        "fixed right-4 bottom-4 z-30 gap-2 rounded-full shadow-lg md:hidden",
        className,
      )}
    >
      {icon}
      {label}
    </Button>
  );
}
