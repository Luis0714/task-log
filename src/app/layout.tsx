import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const satoshi = localFont({
  variable: "--font-satoshi",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/satoshi/Satoshi-Variable.woff2",
      style: "normal",
      weight: "300 900",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Light.woff2",
      style: "normal",
      weight: "300",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Regular.woff2",
      style: "normal",
      weight: "400",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Medium.woff2",
      style: "normal",
      weight: "500",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Bold.woff2",
      style: "normal",
      weight: "700",
    },
  ],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NeosView",
  description:
    "Interfaz conversacional para registrar trabajo en Azure DevOps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${satoshi.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
