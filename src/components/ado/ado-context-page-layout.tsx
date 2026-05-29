import { Suspense, type ReactNode } from "react";

import { SignInRequiredPanel } from "@/components/auth/sign-in-required-panel";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import { cn } from "@/lib/utils";

export type AdoContextPageLayoutProps = {
  shellFallback: ReactNode;
  shell: ReactNode;
  content?: ReactNode | null;
  adoExecutionReady: boolean;
  connectOptions?: ConnectAuthOptions;
  disconnectedFallback?: ReactNode;
  gapClassName?: string;
  className?: string;
};

export function AdoContextPageLayout({
  shellFallback,
  shell,
  content = null,
  adoExecutionReady,
  connectOptions,
  disconnectedFallback,
  gapClassName = "gap-8",
  className,
}: AdoContextPageLayoutProps) {
  const fallback =
    disconnectedFallback ??
    (connectOptions ? (
      <SignInRequiredPanel connectOptions={connectOptions} className="min-h-0 flex-1" />
    ) : null);

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col pb-6",
        gapClassName,
        className,
      )}
    >
      <Suspense fallback={shellFallback}>{shell}</Suspense>
      {adoExecutionReady ? (
        content
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {fallback}
        </div>
      )}
    </div>
  );
}
