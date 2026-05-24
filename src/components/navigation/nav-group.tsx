import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type NavGroupProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function NavGroup({ title, children, className }: NavGroupProps) {
  return (
    <SidebarGroup className={cn("px-0 py-0", className)}>
      <SidebarGroupLabel className="text-sidebar-foreground/60 h-auto px-2 py-1 text-[0.65rem] tracking-wide uppercase">
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent>{children}</SidebarGroupContent>
    </SidebarGroup>
  );
}

export type NavGroupListProps = {
  children: React.ReactNode;
  className?: string;
};

export function NavGroupList({ children, className }: NavGroupListProps) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
}
