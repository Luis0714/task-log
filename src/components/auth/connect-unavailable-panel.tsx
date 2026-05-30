import { USER_MESSAGES } from "@/lib/errors/user-messages";

export function ConnectUnavailablePanel() {
  return (
    <div
      className="border-destructive/30 bg-destructive/5 space-y-2 rounded-lg border p-3"
      role="alert"
    >
      <h3 className="text-sm font-medium">Inicio de sesión no disponible</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {USER_MESSAGES.sessionUnavailable}
      </p>
    </div>
  );
}
