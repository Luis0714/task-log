"use client";

import { Bot, Check, ChevronDown, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Planes disponibles de Neos IA. Cada plan tiene:
 * - `id` — identificador único.
 * - `name` — nombre visible.
 * - `description` — una línea corta que resume el valor del plan.
 * - `icon` — icono lucide para el item del menú.
 * - `current` — `true` si este es el plan activo del usuario.
 *
 * Por ahora solo hay un plan (Neos); Neos Pro queda como placeholder hasta
 * que se habilite la facturación. Cuando Neos Pro esté disponible, basta
 * con marcar `current` en el plan que el usuario tenga contratado.
 */
const PLANS = [
  {
    id: "neos-pro",
    name: "Neos Pro",
    description: "Funcionalidas de IA",
    icon: Sparkles,
    current: false,
  },
  {
    id: "neos",
    name: "Neos",
    description: "Genial para las tareas cotidianas",
    icon: Bot,
    current: true,
  },
] as const;

export function PlanSelector() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Seleccionar plan de Neos IA"
        className="hover:bg-muted/60 text-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 data-[popup-open]:bg-muted/60"
      >
        Neos IA
        <ChevronDown className="size-3.5 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-80 p-2">
        <ul className="flex flex-col gap-1" role="list">
          {PLANS.map((plan, idx) => (
            <li key={plan.id}>
              <PlanRow
                icon={plan.icon}
                name={plan.name}
                description={plan.description}
                current={plan.current}
              />
              {idx < PLANS.length - 1 ? <DropdownMenuSeparator className="my-1" /> : null}
            </li>
          ))}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type PlanRowProps = {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  current: boolean;
};

function PlanRow({ icon: Icon, name, description, current }: Readonly<PlanRowProps>) {
  return (
    <div
      className={cn(
        "hover:bg-muted/60 flex items-center gap-3 rounded-md px-2 py-2 transition-colors",
        current && "bg-muted/40",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-md",
          current
            ? "bg-brand-mark/15 text-brand-mark"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium leading-tight">{name}</div>
        <div className="text-muted-foreground text-xs leading-snug">
          {description}
        </div>
      </div>

      {current ? (
        <span
          aria-label={`${name} es tu plan actual`}
          className="text-brand-mark inline-flex size-6 shrink-0 items-center justify-center"
        >
          <Check className="size-4" />
        </span>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 rounded-full px-3 text-xs"
          // No navega todavía — Neos Pro aún no está disponible. Cuando se
          // habilite, reemplazar `onClick` por la ruta de upgrade.
          onClick={() => {
            // TODO: redirigir a /billing/upgrade cuando exista.
          }}
        >
          Mejorar plan
        </Button>
      )}
    </div>
  );
}
