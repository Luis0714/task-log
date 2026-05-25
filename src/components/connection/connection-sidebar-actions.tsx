"use client";

import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type IconActionButtonProps = {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
};

function IconActionButton({ label, onClick, className, children }: IconActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground size-8 shrink-0",
              className,
            )}
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export function ThemeToggleButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme !== "light" : true;

  return (
    <IconActionButton
      label={isDark ? "Usar tema claro" : "Usar tema oscuro"}
      className={className}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </IconActionButton>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  const handleLogout = useCallback(() => {
    window.location.assign("/api/auth/azdo/logout");
  }, []);

  return (
    <IconActionButton label="Cerrar sesión" className={className} onClick={handleLogout}>
      <LogOut className="size-4" aria-hidden />
    </IconActionButton>
  );
}

