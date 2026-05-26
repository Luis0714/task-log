import { cn } from "@/lib/utils";

export type NeosViewLogoProps = {
  className?: string;
  /** Accesibilidad: si se omite, el SVG es decorativo. */
  title?: string;
  viewBox: string;
  children: React.ReactNode;
};

export function NeosViewLogo({
  className,
  title,
  viewBox,
  children,
}: NeosViewLogoProps) {
  return (
    <svg
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-auto shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}
