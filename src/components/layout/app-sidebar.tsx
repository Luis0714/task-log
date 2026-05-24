import { AppLogo } from "@/components/brand/app-logo";
import { AdoConnectionBadge } from "@/components/connection/ado-connection-badge";
import { NavMenu } from "@/components/navigation/nav-menu";
import { MAIN_NAVIGATION } from "@/config/navigation";
import type { AdoConnectionDisplay } from "@/lib/auth/connection-display";
import { cn } from "@/lib/utils";

export type AppSidebarProps = {
  connection: AdoConnectionDisplay;
  activePath: string;
  className?: string;
};

export function AppSidebar({ connection, activePath, className }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "border-sidebar-border bg-sidebar flex min-h-0 w-full flex-col rounded-xl border",
        "md:min-h-screen md:rounded-none md:border-y-0 md:border-r md:border-l-0",
        className,
      )}
    >
      <header className="border-sidebar-border shrink-0 border-b px-4 py-4">
        <AppLogo />
      </header>

      <nav
        aria-label="Navegación principal"
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
      >
        <NavMenu groups={MAIN_NAVIGATION} activePath={activePath} />
      </nav>

      <footer className="border-sidebar-border shrink-0 border-t p-3">
        <AdoConnectionBadge {...connection} />
      </footer>
    </aside>
  );
}
