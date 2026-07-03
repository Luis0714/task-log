import { cn } from "@/lib/utils";

export type NavGroupListProps = {
  children: React.ReactNode;
  className?: string;
};

export function NavGroupList({ children, className }: NavGroupListProps) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
}
