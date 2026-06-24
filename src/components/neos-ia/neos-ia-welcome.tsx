"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUGGESTION_PROMPTS = [
  "Hoy trabajé 2h en HU-102",
  "Crear 3 tareas para el sprint",
  "¿Qué PBIs tengo activos?",
  "¿Cómo voy del sprint activo?",
] as const;

export type NeosIaWelcomeProps = {
  onPickPrompt: (prompt: string) => void;
  className?: string;
};

/**
 * Empty-state welcome screen for Neos IA. Rendered when there are no messages
 * in the conversation. Visually centered in the available area between the
 * header and the footer, with a gradient title, descriptive paragraph, and a
 * row of suggestion chips that pre-fill the footer's textarea.
 */
export function NeosIaWelcome({ onPickPrompt, className }: Readonly<NeosIaWelcomeProps>) {
  return (
    <section
      aria-label="Bienvenida de Neos IA"
      className={cn(
        "grid min-h-full place-items-center px-4 py-8 sm:py-12",
        className,
      )}
    >
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <div className="bg-primary/10 text-primary inline-flex items-center justify-center rounded-full p-2.5">
          <Sparkles className="size-5" aria-hidden />
        </div>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          <span
            className="bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-transparent"
            aria-label="Hola, soy Neos IA"
          >
            Hola, soy Neos IA
          </span>
          <span aria-hidden className="ml-1.5 motion-safe:animate-pulse">
            👋
          </span>
        </h1>

        <p className="text-muted-foreground max-w-xl text-pretty text-base leading-relaxed sm:text-lg">
          Te ayudaré a reportar tus tiempos de trabajo utilizando lenguaje natural.
          Cuéntame en qué trabajaste hoy y me encargaré de identificar actividades,
          historias de usuario, bugs y tiempos para ayudarte a registrar tu jornada de
          forma rápida y sencilla.
        </p>

        <div
          className="flex flex-wrap items-center justify-center gap-2"
          aria-label="Sugerencias para empezar"
        >
          {SUGGESTION_PROMPTS.map((prompt) => (
            <Button
              key={prompt}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPickPrompt(prompt)}
              className="rounded-full text-xs"
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
