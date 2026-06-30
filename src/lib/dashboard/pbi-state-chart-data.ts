import type { DashboardPbiStateGroup } from "@/lib/dashboard/types";

export type PbiStateBar = {
  state: string;
  count: number;
  items: readonly { id: number; title: string }[];
};

export function buildPbiStateBars(groups: readonly DashboardPbiStateGroup[]): PbiStateBar[] {
  return groups
    .map(({ state, items }) => ({
      state,
      count: items.length,
      items: items.map((i) => ({ id: i.id, title: i.title })),
    }))
    .filter((bar) => bar.count > 0);
}
