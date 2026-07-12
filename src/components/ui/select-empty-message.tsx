import { cn } from "@/lib/utils";

/**
 * Mensaje centrado que se renderiza dentro de un `SelectContent` cuando
 * la opción actual no tiene items. Mantiene el mismo lenguaje visual que
 * los demás empty-states de la plataforma (admin tables, chart-panel).
 */
export type SelectEmptyMessageProps = Readonly<{
  className?: string;
  children: React.ReactNode;
}>;

export function SelectEmptyMessage({ className, children }: SelectEmptyMessageProps) {
  return (
    <div
      role="presentation"
      className={cn(
        "text-muted-foreground px-3 py-6 text-center text-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
