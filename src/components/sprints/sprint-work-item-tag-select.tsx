import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";

export type SprintWorkItemTagSelectProps = {
  tags: readonly AdoWorkItemTagDto[];
  value: string;
  onValueChange: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
};

export function SprintWorkItemTagSelect({
  tags,
  value,
  onValueChange,
  loading = false,
  disabled = false,
  label = "TAC objetivo",
  placeholder = "Selecciona un tag",
}: SprintWorkItemTagSelectProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Skeleton className="h-9 w-full max-w-md" />
      </div>
    );
  }

  const selectedLabel = tags.find((tag) => tag.id === value)?.name;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value || null}
        disabled={disabled || tags.length === 0}
        onValueChange={(next) => onValueChange(next ?? "")}
      >
        <SelectTrigger className="w-full max-w-md">
          <SelectValue placeholder={placeholder}>
            {selectedLabel ?? null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {tags.map((tag) => (
            <SelectItem key={tag.id} value={tag.id}>
              {tag.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
