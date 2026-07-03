import Link from "next/link";

import { NeosViewIsotipoBadge } from "@/components/brand/neosview-isotipo-badge";
import { NeosViewLogotipo } from "@/components/brand/neosview-logotipo";
import { LEGAL_PATHS } from "@/lib/legal/paths";
import { LEGAL_APP_NAME } from "@/lib/legal/contact";
import { cn } from "@/lib/utils";

export type LegalPageShellProps = {
  title: string;
  updatedLabel: string;
  children: React.ReactNode;
  className?: string;
};

export function LegalPageShell({
  title,
  updatedLabel,
  children,
  className,
}: LegalPageShellProps) {
  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <NeosViewIsotipoBadge />
            <NeosViewLogotipo className="h-5 w-auto" />
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Ir a la aplicación
          </Link>
        </div>
      </header>

      <main className={cn("mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14", className)}>
        <p className="text-sm text-muted-foreground">{updatedLabel}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-8 space-y-8">{children}</div>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} {LEGAL_APP_NAME}</span>
          <nav className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href={LEGAL_PATHS.privacy} className="hover:text-foreground">
              Privacidad
            </Link>
            <Link href={LEGAL_PATHS.terms} className="hover:text-foreground">
              Términos del servicio
            </Link>
            <Link href="/" className="hover:text-foreground">
              Inicio
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
