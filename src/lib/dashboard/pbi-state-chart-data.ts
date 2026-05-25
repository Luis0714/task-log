import type { DashboardPbiStateGroup } from "@/lib/dashboard/types";

export type PbiStateBar = {
  state: string;
  count: number;
};

export function buildPbiStateBars(groups: readonly DashboardPbiStateGroup[]): PbiStateBar[] {
  return groups
    .map(({ state, items }) => ({ state, count: items.length }))
    .filter((bar) => bar.count > 0);
}
