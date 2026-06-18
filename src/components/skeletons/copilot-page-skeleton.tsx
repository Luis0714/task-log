import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopilotDailySectionSkeleton } from "@/components/copilot/copilot-daily-section-skeleton";
import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CopilotPageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-5 xl:max-w-3xl",
        className,
      )}
    >
      <PageHeaderSkeleton />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tu mensaje</CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-72" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full rounded-md" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-full max-w-[160px] rounded-md sm:ml-auto" />
          </div>
        </CardContent>
      </Card>

      <CopilotDailySectionSkeleton />
    </div>
  );
}