export type ProgressRingTone = "success" | "warning" | "danger" | "info" | "neutral";

export type ProgressRingBreakdownItem = {
  id: string;
  label: string;
  count: number;
  tone: ProgressRingTone;
};

export type ProgressRingViewModel = {
  percent: number;
  completedCount: number;
  totalCount: number;
  highlight: boolean;
  emptyMessage: string;
  breakdown: ProgressRingBreakdownItem[];
  title?: string;
};

export type ProgressRingKpiViewModel = {
  label: string;
  value: string;
  /** Métrica secundaria (p. ej. story points) bajo el valor principal */
  hint?: string;
  progress: number;
  variant: "default" | "success" | "warning" | "destructive";
  visible: boolean;
};
