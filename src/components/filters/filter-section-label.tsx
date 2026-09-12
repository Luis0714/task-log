import { cn } from "@/lib/utils";

export type FilterSectionLabelProps = Readonly<{
  children: string;
  className?: string;
}>;

export function FilterSectionLabel({ children, className }: FilterSectionLabelProps) {
  return (
    <p
      className={cn(
        "text-muted-foreground text-[11px] font-semibold tracking-wide uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}
