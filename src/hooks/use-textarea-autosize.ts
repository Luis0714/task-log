"use client";

import * as React from "react";

export type UseTextareaAutosizeOptions = {
  /** Altura máxima en píxeles antes de empezar a hacer scroll interno. Por defecto 240 (~6 líneas). */
  maxHeight?: number;
  /** Altura mínima en píxeles. Por defecto 40 (~1 línea). */
  minHeight?: number;
  /**
   * Llamado cuando el `<textarea>` se monta/desmonta con el nodo (o `null`
   * en unmount). Útil para que el padre pueda enfocar el campo o
   * registrar el node sin tener que mutar el ref del hook.
   */
  onMount?: (node: HTMLTextAreaElement | null) => void;
};

/**
 * Auto-grow vertical para textareas. Mide `scrollHeight` después de cada
 * cambio y actualiza `style.height` para que crezca/colapse sin saltos.
 * Resetea a `"auto"` antes de medir para que borrar contenido no deje altura
 * residual. Cuando supera `maxHeight`, deja de crecer y el scroll interno del
 * textarea toma el control.
 *
 * Devuelve un callback `ref` para asignar al `<textarea>` (compatible con
 * `<textarea ref={...} />`) y un `onChange` listo para usar en lugar del
 * `onChange` nativo (también propaga el evento a un handler externo si se
 * pasa). Toda la mutación del DOM vive dentro del hook — el consumidor no
 * necesita escribir a `ref.current`.
 */
export function useTextareaAutosize(
  options: UseTextareaAutosizeOptions = {},
  externalOnChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void,
): {
  ref: React.RefCallback<HTMLTextAreaElement | null>;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onInput: (event: React.SyntheticEvent<HTMLTextAreaElement>) => void;
} {
  const { maxHeight = 240, minHeight = 40, onMount } = options;

  // Ref interno: el callback ref lo escribe; `adjust` lo lee. El consumidor
  // nunca toca este ref directamente — solo recibe el callback.
  const ref = React.useRef<HTMLTextAreaElement | null>(null);

  // Mantenemos `onMount` en un ref para que `setRef` pueda ser estable
  // (deps `[]`) sin capturar una versión vieja del callback en cada render.
  const onMountRef = React.useRef(onMount);
  React.useEffect(() => {
    onMountRef.current = onMount;
  }, [onMount]);

  const adjust = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // Forzamos `min-height` y `max-height` inline para que prevalezcan sobre
    // cualquier clase utilitaria (p.ej. `min-h-16` del shadcn Textarea) y
    // el campo no pueda exceder el rango controlado por este hook.
    el.style.minHeight = `${minHeight}px`;
    el.style.maxHeight = `${maxHeight}px`;

    // Reset para que scrollHeight colapse al borrar contenido.
    el.style.height = "auto";

    // Restar 1px para evitar saltos por sub-pixel rounding en algunos browsers.
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${Math.max(next, minHeight)}px`;

    // Activa el overflow interno cuando excede el máximo.
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [maxHeight, minHeight]);

  const onChange = React.useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjust();
      externalOnChange?.(event);
    },
    [adjust, externalOnChange],
  );

  // `onInput` cubre el caso de paste/IME donde React no dispara onChange en
  // algunos browsers antes del flush.
  const onInput = React.useCallback(() => adjust(), [adjust]);

  // Callback ref estable. React lo invoca con el nodo al montar y con `null`
  // al desmontar / cuando el callback cambia. Como la referencia es estable,
  // React no la llama en cada re-render del padre (solo en mount/unmount).
  const setRef = React.useCallback((node: HTMLTextAreaElement | null) => {
    ref.current = node;
    onMountRef.current?.(node);
  }, []);

  // Ajuste inicial y en resize.
  React.useLayoutEffect(() => {
    adjust();
  }, [adjust]);

  React.useEffect(() => {
    if (globalThis.window === undefined) return;
    const onResize = () => adjust();
    globalThis.window.addEventListener("resize", onResize);
    return () => globalThis.window.removeEventListener("resize", onResize);
  }, [adjust]);

  return { ref: setRef, onChange, onInput };
}
