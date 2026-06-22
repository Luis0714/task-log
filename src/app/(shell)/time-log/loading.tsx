import { TimeLogFormSkeleton } from "@/components/skeletons/time-log-form-skeleton";
import { TimeLogShellSkeleton } from "@/components/skeletons/time-log-shell-skeleton";
import { TimeLogPageLayout } from "@/components/time-log/time-log-page-layout";

export default function TimeLogLoading() {
  return (
    <TimeLogPageLayout>
      <TimeLogShellSkeleton />
      <TimeLogFormSkeleton />
    </TimeLogPageLayout>
  );
}
