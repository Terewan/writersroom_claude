"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/chat-store";
import { DiscussionMessage } from "./discussion-message";
import { ProposalCard } from "./proposal-card";
import { MessageSquare } from "lucide-react";
import type { Database } from "@/types/database";

type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];

interface DiscussionThreadProps {
  proposals: ProposalRow[];
  onProposalDecision: (id: string, status: "approved" | "rejected" | "modified", notes?: string) => void;
}

export function DiscussionThread({ proposals, onProposalDecision }: DiscussionThreadProps) {
  const messages = useChatStore((s) => s.messages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <MessageSquare className="h-10 w-10 opacity-40" />
        <p className="text-sm">Start a discussion to get your agents brainstorming.</p>
      </div>
    );
  }

  // Group proposals by the message that triggered them.
  // Match proposals to the closest preceding agent message by round/turn order,
  // falling back to appending after the last message.
  const sortedProposals = [...proposals].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const proposalsByMessageIndex = new Map<number, ProposalRow[]>();
  for (const proposal of sortedProposals) {
    // Default: place after the last message
    const targetIndex = messages.length - 1;
    const existing = proposalsByMessageIndex.get(targetIndex) ?? [];
    existing.push(proposal);
    proposalsByMessageIndex.set(targetIndex, existing);
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-1 p-4">
        {messages.map((message, index) => (
          <div key={message.id}>
            <DiscussionMessage message={message} />
            {proposalsByMessageIndex.get(index)?.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onDecision={onProposalDecision}
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
