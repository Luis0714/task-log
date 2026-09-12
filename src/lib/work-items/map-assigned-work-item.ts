import type { AdoWorkItemOption } from "@/lib/azure-devops/work-items";
import type {
  LinkableWorkItemDto,
  LinkableWorkItemKind,
} from "@/lib/work-items/linkable-work-item";

export function mapAssignedWorkItem(
  item: AdoWorkItemOption,
  kinds: Record<LinkableWorkItemKind, string>,
): LinkableWorkItemDto {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    kind: resolveKind(item.type, kinds),
    state: item.state,
    description: item.description?.trim() ?? "",
  };
}

function resolveKind(
  rawType: string,
  kinds: Record<LinkableWorkItemKind, string>,
): LinkableWorkItemKind {
  if (rawType === kinds.bug) return "bug";
  if (rawType === kinds.task) return "task";
  return "pbi";
}
