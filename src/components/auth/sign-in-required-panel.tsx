import { Cloud, Sparkles } from "lucide-react";
import Link from "next/link";

import { ConnectSignInTrigger } from "@/components/auth/connect-sign-in-trigger";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import { isSignInUiOffered } from "@/lib/auth/auth-method";
import type { SavedConnectionTarget } from "@/lib/auth/server-state";
import { cn } from "@/lib/utils";

export type SignInRequiredPanelProps = {
  connectOptions: ConnectAuthOptions;
  savedConnectionTarget?: SavedConnectionTarget | null;
  className?: string;
};

export function SignInRequiredPanel({
  connectOptions,
  savedConnectionTarget = null,
  className,
}: SignInRequiredPanelProps) {
  const showSignIn = isSignInUiOffered();

  return (
    <section
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-muted/40 via-background to-primary/5 px-6 py-8 sm:px-10 sm:py-10",
        className,
      )}
      aria-labelledby="sign-in-required-title"
    >
      <div
        className="pointer-events-none absolute -top-16 right-0 size-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-0 size-56 rounded-full bg-emerald-500/5 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 text-center">
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
          <Cloud className="size-7" aria-hidden />
        </div>

        <div className="space-y-2">
          <p className="text-primary inline-flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            Azure DevOps
          </p>
          <h2
            id="sign-in-required-title"
            className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Conecta para continuar
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty sm:text-base">
            Para ver y gestionar tus tareas necesitas vincular tu cuenta. Solo
            toma un minuto y puedes elegir cómo prefieres entrar.
          </p>
        </div>

        {showSignIn ? (
          <div className="flex flex-col items-center gap-3">
            <ConnectSignInTrigger
              connectOptions={connectOptions}
              savedConnectionTarget={savedConnectionTarget}
              className="min-w-44"
            />
            <p className="text-muted-foreground text-xs">
              ¿Cuenta guardada?{" "}
              <Link
                href="/login"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Iniciar sesión
              </Link>
              {" · "}
              <Link
                href="/registro"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Crear cuenta
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
