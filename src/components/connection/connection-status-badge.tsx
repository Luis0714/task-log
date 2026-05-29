import { Badge } from "@/components/ui/badge";

export type ConnectionStatusBadgeProps = {
  isConnected: boolean;
};

export function ConnectionStatusBadge({ isConnected }: ConnectionStatusBadgeProps) {
  if (isConnected) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 shrink-0 text-emerald-400"
      >
        <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
        Conectado
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-border shrink-0 text-muted-foreground">
      <span className="bg-muted-foreground size-1.5 rounded-full" aria-hidden />
      Sin conectar
    </Badge>
  );
}
