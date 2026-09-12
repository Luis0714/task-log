"use client";

import { useTheme } from "next-themes";
import { Toaster as SileoToaster } from "sileo";

import { useIsMobile } from "@/hooks/use-mobile";

type ToasterProps = React.ComponentProps<typeof SileoToaster>;

const MOBILE_OFFSET = {
  bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
  left: 16,
  right: 16,
} as const;

/**
 * Wrapper del `Toaster` de sileo que sincroniza el tema con `next-themes`.
 * En móvil va abajo al centro para no chocar con el header ni recortarse.
 */
function Toaster({
  offset,
  options,
  position = "top-right",
  ...props
}: Readonly<ToasterProps>) {
  const { resolvedTheme } = useTheme();
  const isMobile = useIsMobile();

  return (
    <SileoToaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position={isMobile ? "bottom-center" : position}
      offset={offset ?? (isMobile ? MOBILE_OFFSET : 16)}
      options={{
        ...options,
        styles: {
          title: "normal-case!",
          ...options?.styles,
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
