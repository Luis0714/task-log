import {
  LogoutButton,
  ThemeToggleButton,
} from "@/components/connection/connection-sidebar-actions";

export type ConnectionBadgeToolbarProps = {
  canLogout: boolean;
  showThemeToggle: boolean;
  className?: string;
};

export function ConnectionBadgeToolbar({
  canLogout,
  showThemeToggle,
  className,
}: ConnectionBadgeToolbarProps) {
  return (
    <div className={className}>
      {showThemeToggle ? <ThemeToggleButton className="-mt-0.5" /> : null}
      {canLogout ? <LogoutButton className="-mt-0.5" /> : null}
    </div>
  );
}
