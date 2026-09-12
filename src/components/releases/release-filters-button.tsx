import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RELEASE_FILTERS_TITLE } from "@/lib/releases/copy";

export type ReleaseFiltersButtonProps = {
  activeCount: number;
  onClick: () => void;
};

export function ReleaseFiltersButton({
  activeCount,
  onClick,
}: ReleaseFiltersButtonProps) {
  return (
    <Button type="button" variant="outline" onClick={onClick}>
      <SlidersHorizontal />
      {RELEASE_FILTERS_TITLE}
      {activeCount > 0 ? (
        <span className="bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] leading-none tabular-nums">
          {activeCount}
        </span>
      ) : null}
    </Button>
  );
}
