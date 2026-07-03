import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SETTINGS_CONNECTION_SECTION } from "@/lib/settings/settings-field-copy";
import type { SavedConnectionTarget } from "@/lib/auth/server-state";

export type SettingsConnectionCardProps = {
  connection: SavedConnectionTarget;
};

export function SettingsConnectionCard({ connection }: SettingsConnectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{SETTINGS_CONNECTION_SECTION.title}</CardTitle>
        <CardDescription>{SETTINGS_CONNECTION_SECTION.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Organización:</span>{" "}
          <span className="font-medium">{connection.organization}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Proyecto:</span>{" "}
          <span className="font-medium">{connection.project}</span>
        </p>
        {connection.team ? (
          <p>
            <span className="text-muted-foreground">Equipo por defecto:</span>{" "}
            <span className="font-medium">{connection.team}</span>
          </p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          Usa el enlace «Establecer como predeterminado» en los filtros de cualquier pantalla para
          guardar tu proyecto y equipo. Para cambiar de organización, desconecta y vuelve a conectar
          desde el menú de la app.
        </p>
      </CardContent>
    </Card>
  );
}
