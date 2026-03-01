"use client";

import { useChatStore } from "@/stores/chat-store";

export function AgentTypingIndicator() {
  const currentAgentName = useChatStore((s) => s.currentAgentName);

  if (!currentAgentName) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <span className="flex gap-0.5">
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </span>
      <span>{currentAgentName} is writing...</span>
    </div>
  );
}
