import { z } from "zod";

export const sprintTagsQuerySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
});
