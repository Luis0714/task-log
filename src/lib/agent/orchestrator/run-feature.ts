import "server-only";

import { createHash } from "node:crypto";

import type { AgentProvider, ConversationTurn } from "@/lib/agent/provider/provider.types";
import { createAgentProvider } from "@/lib/agent/provider/provider.factory";
import { getPreviewRateLimiter } from "@/lib/agent/observability/rate-limit";
import { logInteraction } from "@/lib/agent/observability/interaction-log";
import { runLogWorkFeature } from "@/lib/agent/features/log-work";
import {
  runCreateTasksFeature,
  type SprintContext,
} from "@/lib/agent/features/create-tasks";
import type { AgentFeatureKind, AgentRunResult } from "@/lib/agent/types";
import {
  buildAgentErrorMessage,
  classifyAgentError,
  describeProviderError,
} from "@/lib/agent/orchestrator/fallback";
import { classifyIntent } from "@/lib/agent/orchestrator/router";
import type { ToolExecutionContext } from "@/lib/agent/tools/types";
import type { PreviewResult } from "@/lib/schemas/agent";

export type RunLogWorkInput = {
  kind: "log-work";
  message: string;
  sprintContext?: SprintContext;
  history?: ConversationTurn[];
  userRole?: string;
};

export type RunCreateTasksInput = {
  kind: "create-tasks";
  message: string;
  sprintContext: SprintContext;
  history?: ConversationTurn[];
  userRole?: string;
};

export type RunFeatureInput = RunLogWorkInput | RunCreateTasksInput;

export type RunFeatureOptions = {
  userId: string;
  provider?: AgentProvider;
  executionContext?: ToolExecutionContext;
};

export async function runFeature(
  input: RunFeatureInput,
  options: RunFeatureOptions,
): Promise<AgentRunResult<PreviewResult>> {
  const { userId } = options;
  const provider = options.provider ?? createAgentProvider();
  const model = provider.defaultModel;
  const startedAt = Date.now();
  const requestHash = hashRequest(input);

  const limiter = getPreviewRateLimiter();
  const limit = limiter.consume(userId);
  if (!limit.allowed) {
    logInteraction({
      userId,
      feature: input.kind,
      model,
      latencyMs: 0,
      requestHash,
      responseJson: { rate_limited: true },
      ok: false,
      errorMessage: "rate_limited",
    });
    return {
      ok: false,
      kind: input.kind,
      code: "rate_limited",
      userMessage: buildAgentErrorMessage("rate_limited"),
    };
  }

  const featureKind: AgentFeatureKind = input.kind;

  try {
    if (input.kind === "log-work") {
      let routerResult: Awaited<ReturnType<typeof classifyIntent>>;
      try {
        routerResult = await classifyIntent(
          input.message,
          input.history ?? [],
          provider,
          model,
        );
      } catch {
        routerResult = { intent: "time_registration", confidence: "low" };
      }

      if (routerResult.intent === "unsupported") {
        const data: PreviewResult = {
          action: "unsupported",
          reason:
            "Esta consulta está fuera del alcance del registro de tiempo. Puedo ayudarte a registrar horas en tus work items de Azure DevOps.",
        };
        logInteraction({
          userId,
          feature: featureKind,
          model,
          latencyMs: Date.now() - startedAt,
          requestHash,
          responseJson: data,
          ok: true,
        });
        return { ok: true, kind: featureKind, data };
      }

      if (routerResult.intent === "work_item_management" && input.sprintContext) {
        const data = await runCreateTasksFeature({
          message: input.message,
          model,
          provider,
          sprintContext: input.sprintContext,
          executionContext: options.executionContext,
          history: input.history,
          userRole: input.userRole,
        });
        logInteraction({
          userId,
          feature: "create-tasks",
          model,
          latencyMs: Date.now() - startedAt,
          requestHash,
          responseJson: data,
          ok: true,
        });
        return { ok: true, kind: "create-tasks", data };
      }

      const data = await runLogWorkFeature({
        message: input.message,
        model,
        provider,
        executionContext: {
          ...options.executionContext,
          ...(input.sprintContext
            ? { sprintContext: { sprintPath: input.sprintContext.sprintPath } }
            : {}),
        },
        history: input.history,
      });
      logInteraction({
        userId,
        feature: featureKind,
        model,
        latencyMs: Date.now() - startedAt,
        requestHash,
        responseJson: data,
        ok: true,
      });
      return { ok: true, kind: featureKind, data };
    }

    if (input.kind === "create-tasks") {
      const data = await runCreateTasksFeature({
        message: input.message,
        model,
        provider,
        sprintContext: input.sprintContext,
        executionContext: options.executionContext,
        history: input.history,
        userRole: input.userRole,
      });
      logInteraction({
        userId,
        feature: featureKind,
        model,
        latencyMs: Date.now() - startedAt,
        requestHash,
        responseJson: data,
        ok: true,
      });
      return { ok: true, kind: featureKind, data };
    }

    return unreachable(input);
  } catch (err) {
    const code = classifyAgentError(err);
    const errMsg = describeProviderError(err);
    console.error(`[agent:${featureKind}] ${code}: ${errMsg}`);
    logInteraction({
      userId,
      feature: featureKind,
      model,
      latencyMs: Date.now() - startedAt,
      requestHash,
      responseJson: { error: errMsg },
      ok: false,
      errorMessage: errMsg,
    });
    return {
      ok: false,
      kind: featureKind,
      code,
      userMessage: buildAgentErrorMessage(code),
      cause: err,
    };
  }
}

function unreachable(value: never): never {
  throw new Error(`Feature no soportada: ${JSON.stringify(value)}`);
}

function hashRequest(input: RunFeatureInput): string {
  const payload = JSON.stringify(input);
  return createHash("sha256").update(payload).digest("hex");
}
