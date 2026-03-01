"use client";

import type { StreamingMessage } from "@/stores/chat-store";

interface DiscussionMessageProps {
  message: StreamingMessage;
}

export function DiscussionMessage({ message }: DiscussionMessageProps) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center py-2">
        <p className="text-muted-foreground text-sm italic">
          {message.content}
        </p>
      </div>
    );
  }

  if (message.role === "showrunner") {
    return (
      <div className="flex justify-end py-2">
        <div className="max-w-[80%] rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
            You (Showrunner)
          </p>
          <p className="text-sm whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <span className="animate-pulse ml-0.5">&#x2588;</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-3 py-2">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
        style={{ backgroundColor: message.agentColor }}
      >
        {message.agentName.charAt(0).toUpperCase()}
      </div>
      <div className="max-w-[80%]">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-sm font-bold">{message.agentName}</span>
          <span className="text-xs text-muted-foreground">{message.agentRole || "Agent"}</span>
        </div>
        <div className="rounded-lg bg-muted px-4 py-3">
          <p className="text-sm whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <span className="animate-pulse ml-0.5">&#x2588;</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
