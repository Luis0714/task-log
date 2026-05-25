import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type ChartPanelSize = "compact" | "default" | "inline";

const skeletonHeight: Record<ChartPanelSize, string> = {
  compact: "h-[180px] sm:h-[200px]",
  default: "h-[180px]",
  inline: "h-[120px]",
};

export type ChartPanelProps = {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  isEmpty?: boolean;
  size?: ChartPanelSize;
  highlight?: boolean;
  className?: string;
};

export function ChartPanel({
  title,
  children,
  loading = false,
  emptyMessage,
  isEmpty = false,
  size = "default",
  highlight = false,
  className,
}: ChartPanelProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "border-border/60 dark:border-white/6 transition-colors",
        highlight
          ? "border-primary/30 bg-primary/[0.02] ring-1 ring-primary/15"
          : "hover:border-primary/20 hover:bg-card/95",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-2 pt-0">
        <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          {title}
        </p>
        {loading ? (
          <Skeleton className={cn("w-full rounded-lg", skeletonHeight[size])} />
        ) : isEmpty && emptyMessage ? (
          <p className="text-muted-foreground py-6 text-center text-sm">{emptyMessage}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
