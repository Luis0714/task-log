import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { resolveFileDiffPaths } from "@/lib/git/is-git-file-path";
import {
  createFileDiffContext,
  type FileDiffContext,
} from "@/lib/git/load-file-diff";
import { streamResolvedFileDiffs } from "@/lib/git/load-file-diffs";
import { gitFileDiffsRequestSchema } from "@/lib/schemas/git-compare";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NDJSON_HEADERS = {
  "Content-Type": "application/x-ndjson; charset=utf-8",
  "Cache-Control": "no-store",
};

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = gitFileDiffsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm,
      400,
    );
  }

  const caller = await requireAdoCaller();
  if (!caller.ok) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  const paths = resolveFileDiffPaths(parsed.data.paths, parsed.data.priorityPath);
  if (paths.length === 0) {
    return new Response("", { headers: NDJSON_HEADERS });
  }

  let context: FileDiffContext;
  try {
    context = await createFileDiffContext(parsed.data);
  } catch (cause) {
    return apiErrorFromCause(
      "ado/git/file-diffs POST",
      cause,
      "No se pudieron cargar los diffs.",
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (event: unknown) => {
        if (req.signal.aborted) return;
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        await streamResolvedFileDiffs(context, paths, write, req.signal);
      } catch (cause) {
        if (req.signal.aborted) return;
        const response = apiErrorFromCause(
          "ado/git/file-diffs POST",
          cause,
          "No se pudieron cargar los diffs.",
        );
        const payload: unknown = await response.json();
        write(payload);
      } finally {
        try {
          controller.close();
        } catch {
          /* stream already cancelled */
        }
      }
    },
  });

  return new Response(stream, { headers: NDJSON_HEADERS });
}
