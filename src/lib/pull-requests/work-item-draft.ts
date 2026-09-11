import { htmlToPlainText } from "@/lib/html/html-to-plain-text";
import { DESCRIPTION_MAX_LENGTH } from "@/lib/pull-requests/copy";
import type { LinkableWorkItemDto } from "@/lib/work-items/linkable-work-item";

export function workItemDraftTitle(item: LinkableWorkItemDto): string {
  return item.title.trim();
}

export function workItemDraftDescription(item: LinkableWorkItemDto): string {
  const fromDescription = htmlToPlainText(item.description).trim();
  const text = fromDescription || item.title.trim();
  if (text.length <= DESCRIPTION_MAX_LENGTH) return text;
  return text.slice(0, DESCRIPTION_MAX_LENGTH);
}
