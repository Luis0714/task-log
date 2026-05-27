"use client";

import { LogOut } from "lucide-react";
import { useCallback } from "react";

import { IconActionButton } from "@/components/connection/icon-action-button";

export type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const handleLogout = useCallback(() => {
    window.location.assign("/api/auth/azdo/logout");
  }, []);

  return (
    <IconActionButton label="Cerrar sesión" className={className} onClick={handleLogout}>
      <LogOut className="size-4" aria-hidden />
    </IconActionButton>
  );
}
