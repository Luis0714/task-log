"use client";

import type { ComponentType, SVGProps } from "react";
import { FaGoogle } from "react-icons/fa";
import { Select as SelectPrimitive } from "@base-ui/react/select";

import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { OpenAIIcon } from "@/components/icons/openai-icon";
import { PROVIDER_CONFIGS } from "@/lib/agent/providers/config";
import type { ProviderId } from "@/lib/agent/providers/types";
import type { ProviderIconKey } from "@/lib/agent/providers/config";
import { cn } from "@/lib/utils";

type ProviderSelectorProps = {
  value: ProviderId;
  onChange: (id: ProviderId) => void;
  exhaustedProviders?: ReadonlySet<ProviderId>;
  className?: string;
};

type ProviderIconComponent = ComponentType<Omit<SVGProps<SVGSVGElement>, "viewBox">>;

// Lives on the client so React components don't have to cross the
// server/client boundary (config.ts is server-side).
const PROVIDER_ICONS: Record<ProviderIconKey, ProviderIconComponent> = {
  openai: OpenAIIcon,
  google: FaGoogle as ProviderIconComponent,
};

/**
 * Custom Select.Item wrapper.
 *
 * The shadcn `SelectItem` wraps every child in `<SelectPrimitive.ItemText>`
 * so the `<Select.Value>` can read the label. base-ui's text extraction
 * gets confused when ItemText contains icons + badges alongside the label,
 * which makes the click on some items silently no-op (especially the
 * non-default one). To avoid that we render the icon + badges OUTSIDE
 * ItemText and pass the bare label as its only child.
 */
function ProviderItem({
  value,
  cfg,
  cfgExhausted,
}: Readonly<{
  value: ProviderId;
  cfg: (typeof PROVIDER_CONFIGS)[ProviderId];
  cfgExhausted: boolean;
}>) {
  const Icon = PROVIDER_ICONS[cfg.iconKey];
  return (
    <SelectPrimitive.Item
      value={value}
      data-slot="select-item"
      className={cn(
        "relative flex w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none",
        "focus:bg-accent focus:text-accent-foreground",
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <SelectPrimitive.ItemText className="min-w-0 flex-1 truncate">
        {cfg.label}
      </SelectPrimitive.ItemText>
      {cfg.free && !cfgExhausted ? (
        <Badge variant="secondary" className="h-4 px-1 text-[10px]">
          Gratis
        </Badge>
      ) : null}
      {!cfg.free && !cfgExhausted ? (
        <Badge variant="secondary" className="h-4 px-1 text-[10px]">
          Pro
        </Badge>
      ) : null}
      {cfgExhausted ? (
        <Badge
          variant="destructive"
          className="ml-auto h-4 px-1 text-[10px] font-semibold"
        >
          Agotado
        </Badge>
      ) : null}
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckGlyph />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function CheckGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none"
      aria-hidden
    >
      <polyline points="3 8 7 12 13 4" />
    </svg>
  );
}

export function ProviderSelector({
  value,
  onChange,
  exhaustedProviders,
  className,
}: Readonly<ProviderSelectorProps>) {
  const isExhausted = (id: ProviderId) => exhaustedProviders?.has(id) ?? false;
  const currentExhausted = isExhausted(value);
  const current = PROVIDER_CONFIGS[value];
  const CurrentIcon = PROVIDER_ICONS[current.iconKey];

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as ProviderId)}
    >
      <SelectTrigger
        className={cn(
          "h-8 w-auto gap-1.5 border-border/60 bg-background px-2.5 text-xs font-medium shadow-none hover:bg-accent hover:text-accent-foreground focus:ring-0",
          currentExhausted && "border-destructive/60 text-destructive hover:text-destructive",
          className,
        )}
        aria-label="Seleccionar proveedor de IA"
      >
        <CurrentIcon className="size-3.5 shrink-0" aria-hidden />
        <SelectValue />
        {currentExhausted ? (
          <Badge
            variant="destructive"
            className="ml-1 h-4 px-1 text-[10px] font-semibold"
          >
            Agotado
          </Badge>
        ) : null}
      </SelectTrigger>
      <SelectContent align="end">
        {(Object.values(PROVIDER_CONFIGS) as typeof PROVIDER_CONFIGS[ProviderId][]).map((cfg) => (
          <ProviderItem
            key={cfg.id}
            value={cfg.id}
            cfg={cfg}
            cfgExhausted={isExhausted(cfg.id)}
          />
        ))}
      </SelectContent>
    </Select>
  );
}
