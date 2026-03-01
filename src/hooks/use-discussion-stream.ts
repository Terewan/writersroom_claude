import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useSettingsStore } from "@/stores/settings-store";

interface UseDiscussionStreamOptions {
  projectId: string;
  discussionId: string;
  onPause?: () => void;
  onProposal?: (proposal: {
    id: string;
    category: string;
    title: string;
    description: string;
  }) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

// SSE event types from the orchestrator
type SSEEvent =
  | { type: "discussion-start"; discussionId: string }
  | {
      type: "agent-start";
      messageId: string;
      agentId: string;
      agentName: string;
      agentColor: string;
      roundNumber: number;
      turnOrder: number;
    }
  | { type: "agent-delta"; messageId: string; content: string }
  | { type: "agent-done"; messageId: string }
  | {
      type: "proposal";
      id: string;
      category: string;
      title: string;
      description: string;
      proposed_content: Record<string, unknown>;
    }
  | { type: "pause"; messageCount: number }
  | { type: "memory-updated"; entryId: string }
  | { type: "error"; message: string }
  | { type: "done" };

function buildHeaders(
  apiKeys: { anthropic: string; openai: string; google: string },
  modelConfig: { fast: string; smart: string; creative: string },
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKeys.anthropic) headers["x-anthropic-key"] = apiKeys.anthropic;
  if (apiKeys.openai) headers["x-openai-key"] = apiKeys.openai;
  if (apiKeys.google) headers["x-google-key"] = apiKeys.google;

  headers["x-model-fast"] = modelConfig.fast;
  headers["x-model-smart"] = modelConfig.smart;
  headers["x-model-creative"] = modelConfig.creative;

  return headers;
}

function dispatchSSEEvent(
  event: SSEEvent,
  callbacks: Pick<
    UseDiscussionStreamOptions,
    "onPause" | "onProposal" | "onComplete" | "onError"
  >,
): void {
  const store = useChatStore.getState();

  switch (event.type) {
    case "discussion-start": {
      store.setSessionActive(true);
      break;
    }
    case "agent-start": {
      store.addMessage({
        id: event.messageId,
        agentId: event.agentId,
        agentName: event.agentName,
        agentColor: event.agentColor,
        role: "agent",
        content: "",
        roundNumber: event.roundNumber,
        turnOrder: event.turnOrder,
        isStreaming: true,
      });
      store.setCurrentAgentName(event.agentName);
      break;
    }
    case "agent-delta": {
      store.updateMessageContent(event.messageId, event.content);
      break;
    }
    case "agent-done": {
      store.finalizeMessage(event.messageId);
      store.setCurrentAgentName(null);
      break;
    }
    case "proposal": {
      callbacks.onProposal?.({
        id: event.id,
        category: event.category,
        title: event.title,
        description: event.description,
      });
      break;
    }
    case "pause": {
      store.setSessionActive(false);
      callbacks.onPause?.();
      break;
    }
    case "memory-updated": {
      // Acknowledged but no action needed on the client side
      break;
    }
    case "error": {
      callbacks.onError?.(event.message);
      break;
    }
    case "done": {
      store.setSessionActive(false);
      callbacks.onComplete?.();
      break;
    }
  }
}

/**
 * Parses raw SSE text from a chunk buffer into discrete events.
 *
 * SSE format: each event is one or more `data: <json>\n` lines terminated
 * by a blank line (`\n\n`). A single chunk from the ReadableStream may
 * contain partial lines, so we buffer across calls and only yield complete
 * events.
 */
function parseSSEChunk(
  buffer: string,
  chunk: string,
): { events: SSEEvent[]; remaining: string } {
  const combined = buffer + chunk;
  const events: SSEEvent[] = [];

  // Split on double-newline which terminates each SSE event block
  const blocks = combined.split("\n\n");

  // The last element is either empty (if the chunk ended with \n\n) or a
  // partial block that needs to be carried over to the next chunk.
  const remaining = blocks.pop() ?? "";

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Collect all `data:` lines in the block and concatenate them.
    // Per the SSE spec, multiple `data:` lines are joined with newlines.
    const dataLines: string[] = [];
    for (const line of trimmed.split("\n")) {
      if (line.startsWith("data: ")) {
        dataLines.push(line.slice(6));
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5));
      }
      // Ignore other SSE fields (event:, id:, retry:) for now
    }

    if (dataLines.length === 0) continue;

    const jsonStr = dataLines.join("\n");
    try {
      const parsed = JSON.parse(jsonStr) as SSEEvent;
      events.push(parsed);
    } catch {
      // Malformed JSON -- skip this event rather than crash the stream
      console.warn("[useDiscussionStream] Failed to parse SSE event:", jsonStr);
    }
  }

  return { events, remaining };
}

export function useDiscussionStream({
  projectId,
  discussionId,
  onPause,
  onProposal,
  onComplete,
  onError,
}: UseDiscussionStreamOptions) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const modelConfig = useSettingsStore((s) => s.modelConfig);

  // Store callbacks in refs to avoid re-creating start/stop when they change
  const callbacksRef = useRef({ onPause, onProposal, onComplete, onError });
  callbacksRef.current = { onPause, onProposal, onComplete, onError };

  const start = useCallback(async () => {
    // Abort any existing connection before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const headers = buildHeaders(apiKeys, modelConfig);
    const url = `/api/projects/${projectId}/discussions/${discussionId}/start`;

    try {
      setIsConnected(true);

      const response = await fetch(url, {
        method: "POST",
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response
          .json()
          .catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        const errorMessage =
          (errorBody as { message?: string }).message ??
          `HTTP ${response.status}: ${response.statusText}`;
        callbacksRef.current.onError?.(errorMessage);
        setIsConnected(false);
        return;
      }

      const body = response.body;
      if (!body) {
        callbacksRef.current.onError?.("Response body is empty");
        setIsConnected(false);
        return;
      }

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const { events, remaining } = parseSSEChunk(sseBuffer, chunk);
          sseBuffer = remaining;

          for (const event of events) {
            dispatchSSEEvent(event, callbacksRef.current);

            // If the server signals done or error, we can stop reading
            if (event.type === "done" || event.type === "error") {
              reader.cancel();
              setIsConnected(false);
              return;
            }
          }
        }
      } catch (readError: unknown) {
        // AbortError is expected when stop() is called
        if (readError instanceof DOMException && readError.name === "AbortError") {
          return;
        }
        throw readError;
      }

      // Stream ended naturally (server closed connection)
      setIsConnected(false);
    } catch (error: unknown) {
      // AbortError is expected when stop() is called
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const message =
        error instanceof Error ? error.message : "Unknown stream error";
      callbacksRef.current.onError?.(message);
      setIsConnected(false);
    }
  }, [apiKeys, modelConfig, projectId, discussionId]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsConnected(false);
    useChatStore.getState().setSessionActive(false);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return { start, stop, isConnected };
}
