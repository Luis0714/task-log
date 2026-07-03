import { SectionBlockSkeleton } from "@/components/skeletons/section-block-skeleton";

export function SprintItemsListSkeleton({ className }: { className?: string }) {
  return <SectionBlockSkeleton content="list-compact" className={className} />;
}
