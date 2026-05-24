import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const navItemVariants = cva(
  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
  {
    variants: {
      active: {
        true: "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
        false:
          "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export type NavItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
  className?: string;
};

export function NavItem({
  href,
  label,
  icon: Icon,
  isActive = false,
  className,
}: NavItemProps) {
  return (
    <li>
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(navItemVariants({ active: isActive }), className)}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}

export type NavItemListProps = {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
};

export function NavItemList({
  children,
  className,
  "aria-label": ariaLabel = "Navegación principal",
}: NavItemListProps) {
  return (
    <ul className={cn("flex w-full min-w-0 flex-col gap-0.5", className)} aria-label={ariaLabel}>
      {children}
    </ul>
  );
}
