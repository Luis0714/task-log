"use client";

export type SolicitudFieldCardRowProps = Readonly<{
  label: string;
  value: string;
}>;

/** Una fila etiqueta/valor usada dentro de la tarjeta móvil. */
export function SolicitudFieldCardRow({ label, value }: SolicitudFieldCardRowProps) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate" title={value}>
        {value}
      </dd>
    </div>
  );
}
