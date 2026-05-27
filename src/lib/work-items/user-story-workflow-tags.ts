import { workItemHasTag } from "@/lib/work-items/ado-work-item-tags";

export const HU_WORKFLOW_TAG_LABELS = {
  EN_DESARROLLO: "EN DESARROLLO",
  DESARROLLADA: "DESARROLLADA",
} as const;

export const HU_WORKFLOW_TAG_VALUES = Object.values(HU_WORKFLOW_TAG_LABELS);

export type UserStoryWorkflowTagOption = "none" | "en-desarrollo" | "desarrollada";

export const USER_STORY_WORKFLOW_TAG_OPTIONS: ReadonlyArray<{
  value: UserStoryWorkflowTagOption;
  label: string;
}> = [
  { value: "none", label: "Sin tags" },
  { value: "en-desarrollo", label: HU_WORKFLOW_TAG_LABELS.EN_DESARROLLO },
  { value: "desarrollada", label: HU_WORKFLOW_TAG_LABELS.DESARROLLADA },
];

export function workflowTagOptionToAdoTag(
  option: UserStoryWorkflowTagOption,
): string | null {
  switch (option) {
    case "en-desarrollo":
      return HU_WORKFLOW_TAG_LABELS.EN_DESARROLLO;
    case "desarrollada":
      return HU_WORKFLOW_TAG_LABELS.DESARROLLADA;
    default:
      return null;
  }
}

export function resolveUserStoryWorkflowTagOption(
  tags: readonly string[] | undefined,
): UserStoryWorkflowTagOption {
  const safeTags = tags ?? [];

  if (workItemHasTag(safeTags, HU_WORKFLOW_TAG_LABELS.DESARROLLADA)) {
    return "desarrollada";
  }

  if (workItemHasTag(safeTags, HU_WORKFLOW_TAG_LABELS.EN_DESARROLLO)) {
    return "en-desarrollo";
  }

  return "none";
}
