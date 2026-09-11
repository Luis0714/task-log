import { z } from "zod";

import {
  LINKABLE_WORK_ITEM_KINDS,
  type LinkableWorkItemDto,
} from "@/lib/work-items/linkable-work-item";

export const linkableWorkItemsQuerySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  team: z.string().trim().min(1, "Indica el equipo."),
  includeBacklog: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const linkableWorkItemSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  type: z.string(),
  kind: z.enum(LINKABLE_WORK_ITEM_KINDS),
  state: z.string(),
  description: z.string(),
});

export const linkableWorkItemsResponseSchema = z.object({
  items: z.array(linkableWorkItemSchema),
});

export type LinkableWorkItemsQuery = z.infer<typeof linkableWorkItemsQuerySchema>;
export type LinkableWorkItemsResponse = {
  items: LinkableWorkItemDto[];
};
