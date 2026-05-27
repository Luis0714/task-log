import type { UseFormReturn } from "react-hook-form";

import {
  WORK_ITEM_SELECT_ITEM_CLASS,
  WorkItemSelectOption,
} from "@/components/time-log/work-item-select-option";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormInlineError } from "@/components/time-log/fields/form-select-field";
import type { TimeLogCatalog } from "@/lib/time-log/catalog-types";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

type PbiSelectFieldProps = {
  form: UseFormReturn<TimeLogFormValues>;
  catalog: TimeLogCatalog;
};

export function PbiSelectField({ form, catalog }: PbiSelectFieldProps) {
  return (
    <FormField
      control={form.control}
      name="pbiId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Historia de usuario</FormLabel>
          <Select
            value={field.value || null}
            onValueChange={(value) => {
              if (!value) return;
              field.onChange(value);
            }}
            disabled={catalog.pbiSelectDisabled}
          >
            <FormControl>
              <SelectTrigger className="h-auto min-h-8 w-full max-w-full overflow-hidden py-1.5">
                <SelectValue
                  placeholder={catalog.placeholders.pbi}
                  className="min-w-0 overflow-hidden"
                >
                  {catalog.selectedPbi ? (
                    <WorkItemSelectOption item={catalog.selectedPbi} variant="trigger" />
                  ) : null}
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent className="max-h-80 w-(--anchor-width) max-w-(--anchor-width) p-1.5">
              {catalog.pbis.map((item) => (
                <SelectItem
                  key={item.id}
                  value={String(item.id)}
                  textWrap
                  className={WORK_ITEM_SELECT_ITEM_CLASS}
                >
                  <WorkItemSelectOption item={item} variant="select" />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormInlineError message={catalog.pbisError} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
