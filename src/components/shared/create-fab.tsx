"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CreateFabProps = {
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function CreateFab({ label, icon, href, onClick, className }: CreateFabProps) {
  return (
    <Button
      type="button"
      size="lg"
      onClick={onClick}
      className={cn(
        "fixed right-4 bottom-4 z-30 gap-2 rounded-full shadow-lg md:hidden",
        className,
      )}
      {...(href
        ? { nativeButton: false as const, render: <Link href={href} /> }
        : {})}
    >
      {icon}
      {label}
    </Button>
  );
}
