import { cn } from "@/lib/utils";

export type TimeLogStepIndicatorProps = {
  step: 1 | 2;
  className?: string;
};

const STEPS = [
  { id: 1, label: "Contexto", description: "Proyecto, sprint e historia de usuario" },
  { id: 2, label: "Tarea", description: "Detalle y horas" },
] as const;

export function TimeLogStepIndicator({ step, className }: TimeLogStepIndicatorProps) {
  return (
    <ol className={cn("flex flex-col gap-2 sm:flex-row", className)}>
      {STEPS.map((item) => {
        const active = step === item.id;
        const completed = step > item.id;

        return (
          <li
            key={item.id}
            className={cn(
              "flex min-w-0 flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors sm:flex-1",
              active && "border-primary/40 bg-primary/5",
              completed && "border-border bg-muted/40",
              !active && !completed && "border-border bg-background",
            )}
          >
            <span
              className={cn(
                "text-xs font-medium tracking-wide uppercase",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              Paso {item.id}
            </span>
            <span className="text-sm font-semibold">{item.label}</span>
            <span className="text-muted-foreground text-pretty text-xs leading-snug">
              {item.description}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
