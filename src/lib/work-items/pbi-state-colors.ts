/**
 * Resolución visual de estados de work items (HU/PBI, Task, Bug).
 *
 * Single source of truth para colores: el `color` viene de Azure DevOps
 * (`GET /wit/workitemtypes/{type}/states?api-version=7.1`) — NO hay paletas
 * hardcodeadas aquí. Si Azure no devuelve el estado buscado, se usa un color
 * gris neutro de fallback.
 *
 * Patrón de uso en el cliente:
 *   const { states } = useBacklogItemStates();
 *   const presentation = getStatePresentation(states, stateName);
 *
 * Patrón de uso en el servidor:
 *   const states = await listBacklogItemStates(auth);
 *   const badge = getStateExportBadgeStyle(states, stateName);
 */

import type { CSSProperties } from "react";

import type { AdoWorkItemTypeState } from "@/lib/azure-devops/work-item-type-states";

export type WorkItemState = AdoWorkItemTypeState;

export type WorkItemStateBadgeStyle = {
  borderColor: string;
  backgroundColor: string;
  /** Color del texto del badge (calculado según luminancia del background). */
  color: string;
  dotColor: string;
};

export type WorkItemStatePresentation = {
  /** Estado resuelto de Azure, o `null` si no se encontró. */
  state: WorkItemState | null;
  /** Categoría de Azure ("Proposed" | "InProgress" | ...), o "unknown". */
  category: string;
  badgeStyle: WorkItemStateBadgeStyle;
  dotStyle: Pick<CSSProperties, "backgroundColor">;
  surfaceStyle: Pick<CSSProperties, "borderColor" | "backgroundColor">;
  /** Color sólido (sin alpha) para usar en charts. */
  chartColor: string;
};

const FALLBACK_COLOR = "b2b2b2";

function normalizeHex(input: string): string {
  return input.trim().replace(/^#/, "").toLowerCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = normalizeHex(hex);
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

/** Luminancia relativa sRGB (0..1). */
function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
}

/** Elige blanco o negro para el texto según la luminancia del background. */
function pickForeground(hex: string): string {
  return relativeLuminance(hex) > 0.55 ? "#1a1a1a" : "#ffffff";
}

function buildBadgeStyle(hex: string): WorkItemStateBadgeStyle {
  const clean = normalizeHex(hex) || FALLBACK_COLOR;
  return {
    borderColor: `#${clean}`,
    // Fondo al ~10% de opacidad para que el texto lea bien sobre cualquier tema.
    backgroundColor: `#${clean}1a`,
    color: pickForeground(clean),
    dotColor: `#${clean}`,
  };
}

function buildPresentation(state: WorkItemState | null): WorkItemStatePresentation {
  const color = state?.color || FALLBACK_COLOR;
  const badgeStyle = buildBadgeStyle(color);
  return {
    state,
    category: state?.category || "unknown",
    badgeStyle,
    dotStyle: { backgroundColor: badgeStyle.dotColor },
    surfaceStyle: {
      borderColor: badgeStyle.borderColor,
      backgroundColor: badgeStyle.backgroundColor,
    },
    chartColor: badgeStyle.dotColor,
  };
}

const FALLBACK_PRESENTATION = buildPresentation(null);

/** Busca un estado por nombre exacto en la lista devuelta por Azure. */
export function findStateByName(
  states: readonly WorkItemState[],
  name: string,
): WorkItemState | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  return states.find((s) => s.name === trimmed);
}

/** Devuelve la categoría de Azure para un nombre de estado, o `"unknown"`. */
export function getStateCategory(
  states: readonly WorkItemState[],
  name: string,
): string {
  return findStateByName(states, name)?.category || "unknown";
}

/** Devuelve la presentación visual para un nombre de estado. */
export function getStatePresentation(
  states: readonly WorkItemState[],
  name: string,
): WorkItemStatePresentation {
  const state = findStateByName(states, name);
  return state ? buildPresentation(state) : FALLBACK_PRESENTATION;
}

/** Devuelve el color sólido (sin alpha) para gráficos de un estado. */
export function getStateChartColor(
  states: readonly WorkItemState[],
  name: string,
): string {
  return getStatePresentation(states, name).chartColor;
}

/** Devuelve el estilo de badge con colores sólidos para export (OG/PDF). */
export function getStateExportBadgeStyle(
  states: readonly WorkItemState[],
  name: string,
): WorkItemStateBadgeStyle {
  return getStatePresentation(states, name).badgeStyle;
}

/** Indica si un estado debe renderizar un badge (no vacío, no es `—`). */
export function isPbiStateBadgeRenderable(state: string): boolean {
  const trimmed = state.trim();
  return Boolean(trimmed && trimmed !== "—");
}