"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type PullRequestCommentComposerProps = Readonly<{
  placeholder: string;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (content: string) => Promise<boolean>;
  onCancel?: () => void;
}>;

export function PullRequestCommentComposer({
  placeholder,
  submitLabel,
  pending = false,
  onSubmit,
  onCancel,
}: PullRequestCommentComposerProps) {
  const [content, setContent] = useState("");
  const trimmed = content.trim();

  async function handleSubmit() {
    if (!trimmed || pending) return;
    const ok = await onSubmit(trimmed);
    if (ok) setContent("");
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        disabled={pending}
        rows={3}
      />
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={pending || !trimmed}
          onClick={() => void handleSubmit()}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
