import type { UseFormReturn } from "react-hook-form";

import { PbiSelectComboboxField } from "@/components/time-log/fields/pbi-select-combobox-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
          <FormControl>
            <PbiSelectComboboxField
              pbis={catalog.pbis}
              value={field.value || null}
              disabled={catalog.pbiSelectDisabled}
              placeholder={catalog.placeholders.pbi}
              onValueChange={(value) => {
                field.onChange(value ?? "");
              }}
            />
          </FormControl>
          <FormInlineError message={catalog.pbisError} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}