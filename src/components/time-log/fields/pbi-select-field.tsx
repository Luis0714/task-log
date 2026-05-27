import type { UseFormReturn } from "react-hook-form";

import {
  WorkItemSelectOption,
} from "@/components/time-log/work-item-select-option";
import { PbiSelectOptions } from "@/components/time-log/fields/pbi-select-options";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormInlineError } from "@/components/time-log/fields/form-inline-error";
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
          <FormLabel required>Historia de usuario</FormLabel>
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
            <PbiSelectOptions pbis={catalog.pbis} />
          </Select>
          <FormInlineError message={catalog.pbisError} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
