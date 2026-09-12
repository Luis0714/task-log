import { z } from "zod";

export const gitCompareQuerySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  repository: z.string().trim().min(1, "Indica el repositorio."),
  source: z.string().trim().min(1, "Indica la rama origen."),
  target: z.string().trim().min(1, "Indica la rama destino."),
});

export const gitFileDiffQuerySchema = gitCompareQuerySchema.extend({
  path: z.string().trim().min(1, "Indica el archivo."),
});

const gitDiffLineSchema = z.object({
  type: z.enum(["context", "addition", "deletion"]),
  oldNumber: z.number().int().positive().optional(),
  newNumber: z.number().int().positive().optional(),
  content: z.string(),
});

const gitDiffHunkSchema = z.object({
  header: z.string(),
  lines: z.array(gitDiffLineSchema),
});

export const gitCommitSchema = z.object({
  id: z.string(),
  shortId: z.string(),
  message: z.string(),
  author: z.string(),
  authoredAt: z.string(),
});

export const gitFileChangeSchema = z.object({
  path: z.string(),
  kind: z.enum(["added", "modified", "deleted"]),
  additions: z.number().int().nonnegative(),
  deletions: z.number().int().nonnegative(),
  hunks: z.array(gitDiffHunkSchema),
});

export const gitCompareResponseSchema = z.object({
  commits: z.array(gitCommitSchema),
  files: z.array(gitFileChangeSchema),
  commonCommit: z.string().nullable().optional(),
  sourceCommit: z.string().nullable().optional(),
});

export const gitFileDiffResponseSchema = z.object({
  file: gitFileChangeSchema,
});
