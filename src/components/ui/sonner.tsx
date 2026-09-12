"use client";

import { useTheme } from "next-themes";
import { Toaster as SileoToaster } from "sileo";

type ToasterProps = React.ComponentProps<typeof SileoToaster>;

/**
 * Wrapper del `Toaster` de sileo que sincroniza el tema con `next-themes`.
 * Los iconos por estado se definen por-toast en `@/lib/toast` (appToast).
 */
function Toaster({
  offset = 16,
  options,
  ...props
}: Readonly<ToasterProps>) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <SileoToaster
      theme={isLight ? "light" : "dark"}
      offset={offset}
      options={{
        ...options,
        styles: {
          title: "normal-case! min-w-0! truncate!",
          description: isLight ? "text-black/70!" : "text-white/75!",
          ...options?.styles,
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
