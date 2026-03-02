"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { usePromptLogStore } from "@/stores/prompt-log-store";
import type { PromptLogEntry } from "@/stores/prompt-log-store";
import { FileText, ChevronRight, ChevronDown, Loader2 } from "lucide-react";

const CALL_TYPE_STYLES: Record<
  PromptLogEntry["callType"],
  { bg: string; label: string }
> = {
  orchestrator: { bg: "bg-blue-600 text-white", label: "Orchestrator" },
  proposal: { bg: "bg-purple-600 text-white", label: "Proposal" },
  agent: { bg: "bg-green-600 text-white", label: "Agent" },
  memory: { bg: "bg-amber-600 text-white", label: "Memory" },
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function PromptLogEntry({ entry }: { entry: PromptLogEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const style = CALL_TYPE_STYLES[entry.callType];
  const isPending = entry.responseText === null;

  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}

        <Badge className={style.bg}>{style.label}</Badge>

        <span className="truncate font-medium">{entry.label}</span>

        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {entry.modelAlias}
        </span>

        <span className="shrink-0 text-xs text-muted-foreground">
          {formatTime(entry.promptTimestamp)}
        </span>

        {isPending && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-3 border-t px-3 py-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Prompt
            </p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
              {entry.promptText}
            </pre>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Response
              {entry.responseTimestamp && (
                <span className="ml-2 font-normal">
                  {formatTime(entry.responseTimestamp)} (
                  {((entry.responseTimestamp - entry.promptTimestamp) / 1000).toFixed(1)}s)
                </span>
              )}
            </p>
            {isPending ? (
              <div className="flex items-center gap-2 rounded bg-muted p-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Waiting for response...
              </div>
            ) : (
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                {entry.responseText}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function PromptLogView() {
  const entries = usePromptLogStore((s) => s.entries);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <FileText className="h-10 w-10 opacity-40" />
        <p className="text-sm">
          Prompt logs will appear here when a discussion is running.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="space-y-2 p-4">
        {entries.map((entry) => (
          <PromptLogEntry key={entry.id} entry={entry} />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
