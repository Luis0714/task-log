import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata: Metadata = buildPageMetadata(PAGE_SEO.privacy);

const LAST_UPDATED = "26 de mayo de 2026";

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Política de privacidad"
      updatedLabel={`Última actualización: ${LAST_UPDATED}`}
    >
      <PrivacyPolicyContent />
    </LegalPageShell>
  );
}
