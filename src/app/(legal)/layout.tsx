import type { Metadata } from "next";

import { buildRootMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildRootMetadata(),
  robots: { index: true, follow: true },
};

export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
