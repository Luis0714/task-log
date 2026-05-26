import { ViewPlaceholder } from "@/components/layout/view-placeholder";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.settings);

export default function SettingsPage() {
  return <ViewPlaceholder title="Configuración" />;
}
