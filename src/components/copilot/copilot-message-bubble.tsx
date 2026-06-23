"use client";

import { NeosViewIsotipoBadge } from "@/components/brand/neosview-isotipo-badge";
import { cn } from "@/lib/utils";

export type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  userInitials?: string | null;
};

export function CopilotMessageBubble({
  role,
  content,
  userInitials,
}: Readonly<MessageBubbleProps>) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {isUser ? (
        <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
          {userInitials ?? "?"}
        </div>
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-900/50">
          <NeosViewIsotipoBadge className="size-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-red-50/60 text-foreground border border-red-100 rounded-tl-sm dark:border-red-900/40 dark:bg-red-950/20",
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
