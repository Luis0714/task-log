import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type ConnectMethodCardProps = {
  title: string;
  description: string;
  onSelect: () => void;
  className?: string;
};

export function ConnectMethodCard({
  title,
  description,
  onSelect,
  className,
}: ConnectMethodCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "border-border bg-card hover:bg-accent/40 flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium leading-snug">{title}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
      <ChevronRight className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
    </button>
  );
}
