"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Pause, Play, Square } from "lucide-react";

interface ShowrunnerInputProps {
  hasActiveDiscussion: boolean;
  isRunning: boolean;
  isPaused: boolean;
  onStartDiscussion: (topic: string) => void;
  onSendMessage: (content: string) => void;
  onPauseAndInterject: () => void;
  onContinue: () => void;
  onEndDiscussion: () => void;
}

export function ShowrunnerInput({
  hasActiveDiscussion,
  isRunning,
  isPaused,
  onStartDiscussion,
  onSendMessage,
  onPauseAndInterject,
  onContinue,
  onEndDiscussion,
}: ShowrunnerInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!hasActiveDiscussion) {
      onStartDiscussion(trimmed);
    } else {
      onSendMessage(trimmed);
    }
    setInput("");
  }, [input, hasActiveDiscussion, onStartDiscussion, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  if (!hasActiveDiscussion) {
    return (
      <div className="border-t p-4 space-y-3">
        <Textarea
          placeholder="What should the writers' room discuss? e.g. 'Brainstorm the pilot episode cold open...'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-20"
        />
        <Button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="w-full"
        >
          <Send className="h-4 w-4" />
          Start Discussion
        </Button>
      </div>
    );
  }

  if (isRunning && !isPaused) {
    return (
      <div className="border-t p-4">
        <Button
          onClick={onPauseAndInterject}
          variant="outline"
          className="w-full text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950/30"
        >
          <Pause className="h-4 w-4" />
          Pause &amp; Interject
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t p-4 space-y-3">
      <Textarea
        placeholder="Type your direction to the writers' room..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-12"
      />
      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="flex-1"
        >
          <Send className="h-4 w-4" />
          Send
        </Button>
        <Button
          onClick={onContinue}
          variant="outline"
        >
          <Play className="h-4 w-4" />
          Continue
        </Button>
        <Button
          onClick={onEndDiscussion}
          variant="ghost"
          className="text-destructive hover:text-destructive"
        >
          <Square className="h-4 w-4" />
          End
        </Button>
      </div>
    </div>
  );
}
