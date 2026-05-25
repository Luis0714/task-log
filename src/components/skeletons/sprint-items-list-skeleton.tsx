import { SectionBlockSkeleton } from "@/components/skeletons/section-block-skeleton";
import { cn } from "@/lib/utils";

export function SprintItemsListSkeleton({ className }: { className?: string }) {
  return <SectionBlockSkeleton content="list-compact" className={className} />;
}
