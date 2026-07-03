import type { ToolDefinition } from "@/lib/agent/provider/provider.types";
import type { ToolHandler } from "@/lib/agent/tools/types";

type AnyHandler = ToolHandler<unknown, unknown>;

const REGISTRY = new Map<string, AnyHandler>();

export function registerTool<TArgs, TResult>(
  handler: ToolHandler<TArgs, TResult>,
): void {
  REGISTRY.set(handler.definition.name, handler as AnyHandler);
}

export function findToolHandler(name: string): AnyHandler | undefined {
  return REGISTRY.get(name);
}

export function listToolDefinitions(): ToolDefinition[] {
  return Array.from(REGISTRY.values()).map((handler) => handler.definition);
}

export type { ToolHandler } from "@/lib/agent/tools/types";