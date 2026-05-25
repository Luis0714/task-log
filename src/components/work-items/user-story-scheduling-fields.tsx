"use client";

import { UserStoryCommittedFields } from "@/components/work-items/user-story-committed-fields";

export type UserStorySchedulingFieldsProps = {
  startDate: string;
  targetDate: string;
  disabled?: boolean;
  onStartDateChange: (value: string) => void;
  onTargetDateChange: (value: string) => void;
};

export function UserStorySchedulingFields(props: UserStorySchedulingFieldsProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
        Fechas
      </h3>
      <UserStoryCommittedFields {...props} />
    </section>
  );
}
