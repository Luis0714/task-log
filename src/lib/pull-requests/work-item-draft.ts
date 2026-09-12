import { isEmptyRichText } from "@/lib/html/html-to-plain-text";
import { DESCRIPTION_MAX_LENGTH } from "@/lib/pull-requests/copy";
import type {
  LinkableWorkItemDto,
  LinkableWorkItemKind,
} from "@/lib/work-items/linkable-work-item";

const DRAFT_TITLE_PREFIX: Record<LinkableWorkItemKind, string> = {
  pbi: "FEATURE",
  bug: "FIX",
  task: "REFACTOR",
};

export function workItemDraftTitle(item: LinkableWorkItemDto): string {
  return formatDraftHeading(item);
}

export function workItemDraftDescription(item: LinkableWorkItemDto): string {
  const heading = wrapPlainTextAsHtml(formatDraftHeading(item));
  const fromDescription = item.description.trim();
  const html = isEmptyRichText(fromDescription)
    ? heading
    : `${heading}${fromDescription}`;
  if (html.length <= DESCRIPTION_MAX_LENGTH) return html;
  return html.slice(0, DESCRIPTION_MAX_LENGTH);
}

function formatDraftHeading(item: LinkableWorkItemDto): string {
  const prefix = DRAFT_TITLE_PREFIX[item.kind];
  const title = item.title.trim().toUpperCase();
  return title ? `${prefix}: ${title}` : `${prefix}:`;
}

function wrapPlainTextAsHtml(text: string): string {
  if (!text) return "";
  return `<p>${escapeHtml(text)}</p>`;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
