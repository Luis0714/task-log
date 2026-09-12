import type { PullRequestThreadStatus } from "@/lib/pull-requests/thread-types";
import { PULL_REQUEST_THREAD_STATUSES } from "@/lib/pull-requests/thread-types";

export const PULL_REQUEST_THREAD_STATUS_LABEL: Record<
  PullRequestThreadStatus,
  string
> = {
  active: "Activo",
  pending: "Pendiente",
  fixed: "Resuelto",
  wontFix: "No se corregirá",
  closed: "Cerrado",
  byDesign: "Por diseño",
};

export const PULL_REQUEST_THREAD_STATUS_OPTIONS = PULL_REQUEST_THREAD_STATUSES.map(
  (status) => ({
    value: status,
    label: PULL_REQUEST_THREAD_STATUS_LABEL[status],
  }),
);

const STATUS_BY_CODE: Record<string, PullRequestThreadStatus> = {
  "1": "active",
  "2": "fixed",
  "3": "wontFix",
  "4": "closed",
  "5": "byDesign",
  "6": "pending",
  active: "active",
  pending: "pending",
  fixed: "fixed",
  resolved: "fixed",
  wontfix: "wontFix",
  "won't fix": "wontFix",
  closed: "closed",
  bydesign: "byDesign",
};

export function mapPullRequestThreadStatus(
  raw: string | number | undefined,
): PullRequestThreadStatus {
  const key = String(raw ?? "").trim().toLowerCase();
  return STATUS_BY_CODE[key] ?? "active";
}

export function isOpenThreadStatus(status: PullRequestThreadStatus): boolean {
  return status === "active" || status === "pending";
}
