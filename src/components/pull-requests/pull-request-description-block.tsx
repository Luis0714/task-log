import { RichTextContent } from "@/components/ui/rich-text-content";

export type PullRequestDescriptionBlockProps = {
  description: string;
};

export function PullRequestDescriptionBlock({
  description,
}: PullRequestDescriptionBlockProps) {
  return (
    <section className="rounded-xl border bg-card p-3">
      <h2 className="text-sm font-medium">Descripción</h2>
      {description.trim() ? (
        <RichTextContent html={description} className="mt-2" />
      ) : (
        <p className="text-muted-foreground mt-2 text-sm">Sin descripción.</p>
      )}
    </section>
  );
}
