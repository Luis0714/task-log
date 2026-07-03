"use client";

import type { ReactNode } from "react";

import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton";
import { useAuthRehydration } from "@/hooks/auth/use-auth-rehydration";

export type DashboardAuthTransitionProps = {
  showLiveData: boolean;
  children: ReactNode;
};

export function DashboardAuthTransition({
  showLiveData,
  children,
}: DashboardAuthTransitionProps) {
  const rehydrating = useAuthRehydration(showLiveData);

  if (rehydrating) {
    return <DashboardPageSkeleton />;
  }

  return children;
}
