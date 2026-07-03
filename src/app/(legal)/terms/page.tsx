import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { TermsOfServiceContent } from "@/components/legal/terms-of-service-content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata: Metadata = buildPageMetadata(PAGE_SEO.terms);

const LAST_UPDATED = "26 de mayo de 2026";

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Términos del servicio"
      updatedLabel={`Última actualización: ${LAST_UPDATED}`}
    >
      <TermsOfServiceContent />
    </LegalPageShell>
  );
}
