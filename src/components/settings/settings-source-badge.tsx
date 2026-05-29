import { Badge } from "@/components/ui/badge";
import { formatProfileSourceLabel } from "@/lib/settings/settings-field-copy";
import type { AdoProcessProfileFieldSource } from "@/lib/azure-devops/process-profile-types";
import { cn } from "@/lib/utils";

const SOURCE_VARIANT: Record<
  AdoProcessProfileFieldSource,
  "default" | "secondary" | "outline"
> = {
  env: "outline",
  default: "outline",
  discovered: "secondary",
  session: "secondary",
  manual: "default",
};

export type SettingsSourceBadgeProps = {
  source: AdoProcessProfileFieldSource;
  className?: string;
};

export function SettingsSourceBadge({ source, className }: SettingsSourceBadgeProps) {
  return (
    <Badge variant={SOURCE_VARIANT[source]} className={cn(className)}>
      {formatProfileSourceLabel(source)}
    </Badge>
  );
}
