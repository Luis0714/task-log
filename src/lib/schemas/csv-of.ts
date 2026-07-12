import { z } from "zod";

export const csvOf = z
  .string()
  .optional()
  .transform((value) =>
    value
      ? value
          .split(",")
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
      : [],
  );

export type CsvOf = z.infer<typeof csvOf>;