import {
  WORK_ITEM_SELECT_ITEM_CLASS,
  WorkItemSelectOption,
} from "@/components/time-log/work-item-select-option";
import {
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";

export type PbiSelectOptionsProps = {
  pbis: TimeLogCatalog["pbis"];
};

export function PbiSelectOptions({ pbis }: PbiSelectOptionsProps) {
  return (
    <SelectContent
      alignItemWithTrigger={false}
      className="max-h-[min(20rem,var(--available-height))] w-(--anchor-width) max-w-(--anchor-width) p-0"
    >
      <SelectGroup className="p-1.5">
        {pbis.map((item) => (
          <SelectItem
            key={item.id}
            value={String(item.id)}
            textWrap
            className={WORK_ITEM_SELECT_ITEM_CLASS}
          >
            <WorkItemSelectOption item={item} variant="select" />
          </SelectItem>
        ))}
      </SelectGroup>
    </SelectContent>
  );
}
