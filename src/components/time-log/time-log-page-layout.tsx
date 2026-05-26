import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type TimeLogPageLayoutProps = {
  children: ReactNode;
  className?: string;
};

/** Ancho legible del flujo de registro de tiempo en móvil, tablet y escritorio. */
export function TimeLogPageLayout({ children, className }: TimeLogPageLayoutProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 max-w-2xl flex-col xl:max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
