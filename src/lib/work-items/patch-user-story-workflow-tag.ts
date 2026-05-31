import {
  mergeWorkflowTags,
  parseAdoWorkItemTags,
  serializeAdoWorkItemTags,
} from "@/lib/work-items/ado-work-item-tags";
import {
  HU_WORKFLOW_TAG_VALUES,
  workflowTagOptionToAdoTag,
  type UserStoryWorkflowTagOption,
} from "@/lib/work-items/user-story-workflow-tags";
import type { WorkItemFieldPatchOp } from "@/lib/azure-devops/work-item-patch";

export const SYSTEM_TAGS_FIELD = "System.Tags";

export function buildWorkflowTagPatchOp(
  existingTagsRaw: string | undefined,
  workflowTag: UserStoryWorkflowTagOption,
): WorkItemFieldPatchOp {
  const existingTags = parseAdoWorkItemTags(existingTagsRaw);
  const nextTags = mergeWorkflowTags(
    existingTags,
    HU_WORKFLOW_TAG_VALUES,
    workflowTagOptionToAdoTag(workflowTag),
  );

  return buildWorkItemTagsPatchOp(existingTagsRaw, nextTags);
}

export function buildWorkItemTagsPatchOp(
  existingTagsRaw: string | undefined,
  nextTags: readonly string[],
): WorkItemFieldPatchOp {
  const hadValue = Boolean(existingTagsRaw?.trim());

  return {
    op: hadValue ? "replace" : "add",
    path: `/fields/${SYSTEM_TAGS_FIELD}`,
    value: serializeAdoWorkItemTags(nextTags),
  };
}
