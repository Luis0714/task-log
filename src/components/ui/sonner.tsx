"use client";

import { useTheme } from "next-themes";
import { Toaster as SileoToaster } from "sileo";

type ToasterProps = React.ComponentProps<typeof SileoToaster>;

/**
 * Wrapper del `Toaster` de sileo que sincroniza el tema con `next-themes`.
 * Los iconos por estado se definen por-toast en `@/lib/toast` (appToast).
 */
function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <SileoToaster
      theme={resolvedTheme === "light" ? "light" : "dark"}
      {...props}
    />
  );
}

export { Toaster };
