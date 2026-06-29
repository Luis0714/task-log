"use client";

const TITLE = "¿En qué trabajaste hoy?";

export type NeosIaWelcomeProps = {
  onPickPrompt?: never;
  className?: string;
};

/**
 * Empty-state de Neos IA. Solo el título centrado — copy específico de
 * nuestra plataforma (registro de horas en Azure DevOps), NO genérico.
 * Las quick action pills viven **debajo** del composer en el layout padre,
 * no aquí — para que el usuario vea primero el input (acción principal)
 * y luego las alternativas.
 */
export function NeosIaWelcome({ className }: Readonly<NeosIaWelcomeProps>) {
  return (
    <h1
      className={`text-2xl font-semibold tracking-tight sm:text-3xl ${className ?? ""}`}
    >
      {TITLE}
    </h1>
  );
}
