import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  USER_STORY_WORKFLOW_TAG_OPTIONS,
  type UserStoryWorkflowTagOption,
} from "@/lib/work-items/user-story-workflow-tags";

export type UserStoryWorkflowTagFieldProps = {
  value: UserStoryWorkflowTagOption;
  onChange: (value: UserStoryWorkflowTagOption) => void;
  disabled?: boolean;
};

export function UserStoryWorkflowTagField({
  value,
  onChange,
  disabled = false,
}: UserStoryWorkflowTagFieldProps) {
  const selectedLabel = USER_STORY_WORKFLOW_TAG_OPTIONS.find(
    (option) => option.value === value,
  )?.label;

  return (
    <section className="space-y-2">
      <Label htmlFor="user-story-workflow-tag">Tag de flujo</Label>
      <Select
        value={value}
        onValueChange={(next) => onChange((next ?? "none") as UserStoryWorkflowTagOption)}
        disabled={disabled}
      >
        <SelectTrigger id="user-story-workflow-tag" className="w-full">
          <SelectValue placeholder="Selecciona un tag de flujo">
            {selectedLabel ?? null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {USER_STORY_WORKFLOW_TAG_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </section>
  );
}
