import { cn } from "@/lib/utils";

export type NavGroupProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function NavGroup({ title, children, className }: NavGroupProps) {
  const headingId = `nav-group-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-1", className)}
    >
      <h2
        id={headingId}
        className="text-sidebar-foreground/60 px-2 text-xs font-medium tracking-wide uppercase"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export type NavGroupListProps = {
  children: React.ReactNode;
  className?: string;
};

export function NavGroupList({ children, className }: NavGroupListProps) {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>;
}
