import { Building2, ShieldCheck } from "lucide-react";

import { ConnectSignInTrigger } from "@/components/auth/connect-sign-in-trigger";
import { ConnectionBadgeToolbar } from "@/components/connection/connection-badge-toolbar";
import { ConnectionStatusBadge } from "@/components/connection/connection-status-badge";
import { ConnectionUserIdentity } from "@/components/connection/connection-user-identity";
import { Badge } from "@/components/ui/badge";
import { buildConnectionMetaLine } from "@/lib/auth/connection-display-labels";
import type { AdoConnectionDisplay } from "@/lib/auth/connection-display";
import { cn } from "@/lib/utils";

// Clases compartidas con `ConnectionStatusBadge` (mismo `h-5`, `rounded-4xl`,
// `px-2 py-0.5`, `gap-1.5`, `text-[11px]`) para que los tres badges del
// footer tengan el mismo tamaño y forma. Solo variamos el color (semántica).
// `w-full` es para que el badge llene la celda del grid y todos queden
// alineados al ancho del más ancho.
const META_BADGE_CLASS =
  "border-sidebar-primary/25 bg-sidebar-primary/10 text-sidebar-primary w-full gap-1.5 text-[11px] font-semibold";

export type ConnectionBadgeExpandedProps = AdoConnectionDisplay & {
  className?: string;
};

export function ConnectionBadgeExpanded({
  authMethod,
  isConnected,
  canLogout,
  connectOptions,
  savedConnectionTarget,
  showSignIn,
  organization,
  userDisplayName,
  userInitials,
  userAvatarUrl,
  userRole,
  className,
}: ConnectionBadgeExpandedProps) {
  const showUser = Boolean(isConnected && userDisplayName && userInitials);
  const { organization: metaOrg, role: metaRole } = buildConnectionMetaLine(
    organization,
    authMethod,
    isConnected,
    userRole,
  );
  const hasMeta = Boolean(metaRole || metaOrg);
  const showInlineToolbar = !showUser && canLogout;

  return (
    <section
      aria-label="Conexión con Azure DevOps"
      className={cn(
        "border-sidebar-border bg-sidebar-accent/25 flex flex-col gap-2.5 rounded-lg border p-3",
        className,
      )}
    >
      {showUser ? (
        <ConnectionUserIdentity
          displayName={userDisplayName!}
          initials={userInitials!}
          avatarUrl={userAvatarUrl}
        />
      ) : null}

      {showUser ? (
        <div className="border-sidebar-border border-t" aria-hidden />
      ) : null}

      {/* Badges con ancho uniforme: conexión, rol, organización.
          El grid `grid w-max grid-cols-1` hace que el contenedor se
          dimensione al badge más ancho y que todos los hijos llenen esa
          celda, quedando visualmente alineados al ancho del más grande.
          `mx-auto` centra el bloque horizontalmente dentro del footer. */}
      <ul className="grid w-max grid-cols-1 gap-1.5 mx-auto">
        <li className="flex min-w-0 items-center">
          <ConnectionStatusBadge
            isConnected={isConnected}
            className="w-full"
          />
        </li>
        {hasMeta && metaRole ? (
          <li className="flex min-w-0 items-center">
            <Badge variant="outline" className={META_BADGE_CLASS}>
              <ShieldCheck aria-hidden />
              <span className="min-w-0 truncate">{metaRole}</span>
            </Badge>
          </li>
        ) : null}
        {hasMeta && metaOrg ? (
          <li className="flex min-w-0 items-center">
            <Badge
              variant="outline"
              className={META_BADGE_CLASS}
              title={metaOrg}
            >
              <Building2 aria-hidden />
              <span className="min-w-0 truncate">{metaOrg}</span>
            </Badge>
          </li>
        ) : null}
      </ul>

      {/* Toolbar inline (solo cuando NO hay identidad de usuario mostrada
          y sí se puede cerrar sesión). La movemos a su propia fila porque
          el badge de conexión ahora vive dentro del grid uniforme. */}
      {showInlineToolbar ? (
        <ConnectionBadgeToolbar
          canLogout={canLogout}
          showThemeToggle={true}
          className="flex items-center justify-end gap-0.5"
        />
      ) : null}

      {/* Acciones (logout) cuando el usuario está identificado */}
      {showUser && canLogout ? (
        <div className="border-sidebar-border flex items-center justify-end gap-1 border-t pt-2">
          <ConnectionBadgeToolbar
            canLogout={canLogout}
            showThemeToggle={false}
            className="flex items-center gap-0.5"
          />
        </div>
      ) : null}

      {showSignIn ? (
        <ConnectSignInTrigger
          connectOptions={connectOptions}
          savedConnectionTarget={savedConnectionTarget}
          fullWidth
        />
      ) : null}
    </section>
  );
}
