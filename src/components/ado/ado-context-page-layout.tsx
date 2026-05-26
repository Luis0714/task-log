import { Suspense, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AdoContextPageLayoutProps = {
  shellFallback: ReactNode;
  shell: ReactNode;
  content?: ReactNode | null;
  adoExecutionReady: boolean;
  gapClassName?: string;
  className?: string;
};

export function AdoContextPageLayout({
  shellFallback,
  shell,
  content = null,
  adoExecutionReady,
  gapClassName = "gap-8",
  className,
}: AdoContextPageLayoutProps) {
  return (
    <div className={cn("flex w-full flex-col pb-6", gapClassName, className)}>
      <Suspense fallback={shellFallback}>{shell}</Suspense>
      {adoExecutionReady ? content : null}
    </div>
  );
}
