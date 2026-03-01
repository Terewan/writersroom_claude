"use client";

import { useState, useCallback } from "react";
import { useProjectContext } from "../layout";
import { useChatStore } from "@/stores/chat-store";
import {
  useDiscussions,
  useCreateDiscussion,
  useProposals,
  useUpdateProposal,
} from "@/hooks/use-discussions";
import { useDiscussionStream } from "@/hooks/use-discussion-stream";
import { useQueryClient } from "@tanstack/react-query";
import { useDataRepository } from "@/hooks/use-data-repository";

import { SplitPanel } from "@/components/layout/split-panel";
import { DiscussionThread } from "@/components/room/discussion-thread";
import { DiscussionSidebar } from "@/components/room/discussion-sidebar";
import { ShowrunnerInput } from "@/components/room/showrunner-input";
import { AgentTypingIndicator } from "@/components/room/agent-typing-indicator";

import { MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function WritersRoomPage() {
  const { project, agents } = useProjectContext();
  const queryClient = useQueryClient();
  const repo = useDataRepository();

  const [activeDiscussionId, setActiveDiscussionId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const { data: discussions } = useDiscussions(project.id);
  const createDiscussion = useCreateDiscussion(project.id);
  const { data: proposals } = useProposals(activeDiscussionId ?? "");
  const updateProposal = useUpdateProposal(activeDiscussionId ?? "");

  const handlePause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleProposal = useCallback(() => {
    if (activeDiscussionId) {
      queryClient.invalidateQueries({ queryKey: ["proposals", activeDiscussionId] });
    }
  }, [activeDiscussionId, queryClient]);

  const handleComplete = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error("[WritersRoom] Stream error:", error);
    setIsPaused(true);
  }, []);

  const { start, stop } = useDiscussionStream({
    projectId: project.id,
    discussionId: activeDiscussionId ?? "",
    onPause: handlePause,
    onProposal: handleProposal,
    onComplete: handleComplete,
    onError: handleError,
  });

  const handleStartDiscussion = useCallback(async (topic: string) => {
    try {
      const discussion = await createDiscussion.mutateAsync({
        project_id: project.id,
        topic,
      });
      setActiveDiscussionId(discussion.id);
      setIsPaused(false);
      useChatStore.getState().clearMessages();
      // Start streaming after creating the discussion
      // Small delay to ensure state is settled
      setTimeout(() => start(), 50);
    } catch (err) {
      console.error("[WritersRoom] Failed to create discussion:", err);
    }
  }, [createDiscussion, project.id, start]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeDiscussionId) return;
    try {
      // Persist the showrunner message
      await repo.createMessage({
        discussion_id: activeDiscussionId,
        agent_id: null,
        round_number: 0,
        turn_order: useChatStore.getState().messages.length + 1,
        role: "showrunner",
        content,
      });

      // Add to chat store for immediate display
      useChatStore.getState().addMessage({
        id: crypto.randomUUID(),
        agentId: null,
        agentName: "Showrunner",
        agentColor: "#f59e0b",
        role: "showrunner",
        content,
        roundNumber: 0,
        turnOrder: useChatStore.getState().messages.length + 1,
        isStreaming: false,
      });
    } catch (err) {
      console.error("[WritersRoom] Failed to send message:", err);
    }
  }, [activeDiscussionId, repo]);

  const handlePauseAndInterject = useCallback(() => {
    stop();
    setIsPaused(true);
  }, [stop]);

  const handleContinue = useCallback(() => {
    setIsPaused(false);
    start();
  }, [start]);

  const handleEndDiscussion = useCallback(async () => {
    if (!activeDiscussionId) return;
    try {
      stop();
      await repo.updateDiscussion(activeDiscussionId, { status: "completed" });
      queryClient.invalidateQueries({ queryKey: ["discussions", project.id] });
      setIsPaused(false);
      useChatStore.getState().setSessionActive(false);
    } catch (err) {
      console.error("[WritersRoom] Failed to end discussion:", err);
    }
  }, [activeDiscussionId, stop, repo, queryClient, project.id]);

  const handleSelectDiscussion = useCallback(async (id: string) => {
    // Stop any active stream
    stop();
    setActiveDiscussionId(id);
    useChatStore.getState().clearMessages();

    // Load existing messages into the chat store
    try {
      const messages = await repo.listMessages(id);
      const agentMap = new Map(agents.map((a) => [a.id, a]));

      for (const msg of messages) {
        const agent = msg.agent_id ? agentMap.get(msg.agent_id) : null;
        useChatStore.getState().addMessage({
          id: msg.id,
          agentId: msg.agent_id,
          agentName: agent?.name ?? "Showrunner",
          agentColor: agent?.avatar_color ?? "#f59e0b",
          role: msg.role,
          content: msg.content,
          roundNumber: msg.round_number,
          turnOrder: msg.turn_order,
          isStreaming: false,
        });
      }

      // Check discussion status to set paused state
      const discussion = await repo.getDiscussion(id);
      setIsPaused(discussion?.status === "paused" || discussion?.status === "completed");
    } catch (err) {
      console.error("[WritersRoom] Failed to load discussion:", err);
    }
  }, [stop, repo, agents]);

  const handleNewDiscussion = useCallback(() => {
    stop();
    setActiveDiscussionId(null);
    setIsPaused(false);
    useChatStore.getState().clearMessages();
  }, [stop]);

  const handleProposalDecision = useCallback(
    (id: string, status: "approved" | "rejected" | "modified", notes?: string) => {
      updateProposal.mutate({
        id,
        data: { status, user_notes: notes ?? null },
      });
    },
    [updateProposal],
  );

  const isSessionActive = useChatStore((s) => s.isSessionActive);
  const isRunning = isSessionActive && !isPaused;

  // Guard: need >= 2 agents
  if (agents.length < 2) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <Users className="h-12 w-12" />
        <h2 className="text-xl font-semibold text-foreground">
          Need More Writers
        </h2>
        <p className="max-w-md text-center">
          The Writer&apos;s Room needs at least 2 agents to start a discussion.
          Add agents on the Agents page first.
        </p>
        <Link href={`/project/${project.id}/agents`}>
          <Button>
            <Users className="h-4 w-4" />
            Go to Agents
          </Button>
        </Link>
      </div>
    );
  }

  const chatPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">
          {activeDiscussionId
            ? (discussions ?? []).find((d) => d.id === activeDiscussionId)?.topic ?? "Discussion"
            : "Writer's Room"}
        </h2>
      </div>

      <DiscussionThread
        proposals={proposals ?? []}
        onProposalDecision={handleProposalDecision}
      />

      <AgentTypingIndicator />

      <ShowrunnerInput
        hasActiveDiscussion={activeDiscussionId !== null}
        isRunning={isRunning}
        isPaused={isPaused}
        onStartDiscussion={handleStartDiscussion}
        onSendMessage={handleSendMessage}
        onPauseAndInterject={handlePauseAndInterject}
        onContinue={handleContinue}
        onEndDiscussion={handleEndDiscussion}
      />
    </div>
  );

  const sidebar = (
    <DiscussionSidebar
      discussions={discussions ?? []}
      activeDiscussionId={activeDiscussionId}
      onSelectDiscussion={handleSelectDiscussion}
      onNewDiscussion={handleNewDiscussion}
    />
  );

  return (
    <SplitPanel
      left={chatPanel}
      right={sidebar}
      defaultLeftSize={75}
      minLeftSize={50}
      minRightSize={15}
    />
  );
}
