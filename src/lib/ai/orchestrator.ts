import { generateObject, streamText } from "ai";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import type { DataRepository } from "@/lib/data/repository";
import type { Database } from "@/types/database";
import {
  orchestratorDecisionSchema,
  memoryExtractionSchema,
  proposalExtractionSchema,
} from "@/lib/validators";
import { buildOrchestratorPrompt } from "./prompts/orchestrator";
import { buildAgentSystemPrompt } from "./prompts/agent-system";
import { buildMemoryBrokerPrompt } from "./prompts/memory-broker";
import { buildProposalExtractorPrompt } from "./prompts/proposal-extractor";

type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type DiscussionRow = Database["public"]["Tables"]["discussions"]["Row"];
type DiscussionMessageRow =
  Database["public"]["Tables"]["discussion_messages"]["Row"];
type MemoryIndexRow = Database["public"]["Tables"]["memory_index"]["Row"];
type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];

// ── SSE Event Types ───────────────────────────────────────────────────────

export type OrchestratorEvent =
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

// ── Config ────────────────────────────────────────────────────────────────

interface OrchestratorConfig {
  smartModel: LanguageModelV3;
  creativeModel: LanguageModelV3;
  fastModel: LanguageModelV3;
  agents: AgentRow[];
  discussion: DiscussionRow;
  existingMessages: DiscussionMessageRow[];
  existingMemories: MemoryIndexRow[];
  approvedProposals: ProposalRow[];
  repository: DataRepository;
}

// ── Internal Types ────────────────────────────────────────────────────────

interface RecentMessage {
  agentName: string;
  content: string;
}

const MAX_MESSAGES_PER_RUN = 5;
const RECENT_CONTEXT_COUNT = 3;

// ── Orchestrator ──────────────────────────────────────────────────────────

export class DiscussionOrchestrator {
  private config: OrchestratorConfig;
  private messageCount: number;
  private turnOrder: number;
  private sessionMessages: DiscussionMessageRow[];

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.messageCount = config.existingMessages.length;
    this.turnOrder = config.existingMessages.length;
    this.sessionMessages = [];
  }

  async *run(): AsyncGenerator<OrchestratorEvent> {
    try {
      yield* this.executeDiscussion();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown orchestrator error";
      yield { type: "error", message };
      yield { type: "done" };
    }
  }

  private async *executeDiscussion(): AsyncGenerator<OrchestratorEvent> {
    yield {
      type: "discussion-start",
      discussionId: this.config.discussion.id,
    };

    await this.config.repository.updateDiscussion(this.config.discussion.id, {
      status: "running",
    });

    const startingCount = this.messageCount;

    for (let i = 0; i < MAX_MESSAGES_PER_RUN; i++) {
      const recentMessages = this.getRecentMessages();

      const decision = await this.askOrchestrator(recentMessages);

      if (decision.should_propose && decision.proposal_category) {
        yield* this.extractAndYieldProposals(
          recentMessages,
          decision.proposal_category,
        );
      }

      if (decision.should_pause || this.messageCount >= startingCount + MAX_MESSAGES_PER_RUN) {
        yield* this.pauseDiscussion();
        return;
      }

      const selectedAgent = this.findAgent(decision.next_agent_id);
      if (!selectedAgent) {
        yield* this.pauseDiscussion();
        return;
      }

      const memories = await this.fetchRelevantMemories(selectedAgent);
      const systemPrompt = this.buildAgentPrompt(selectedAgent, memories);
      const conversationContext = this.buildConversationContext(recentMessages);

      yield* this.streamAgentResponse(
        selectedAgent,
        systemPrompt,
        conversationContext,
      );

      this.messageCount++;
    }

    yield* this.pauseDiscussion();
  }

  // ── Orchestrator Decision ─────────────────────────────────────────────

  private async askOrchestrator(recentMessages: RecentMessage[]) {
    const prompt = buildOrchestratorPrompt({
      topic: this.config.discussion.topic,
      agents: this.config.agents.map((a) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        expertise: a.expertise,
      })),
      recentMessages,
      messageCount: this.messageCount,
    });

    const result = await generateObject({
      model: this.config.smartModel,
      schema: orchestratorDecisionSchema,
      prompt,
    });

    return result.object;
  }

  // ── Proposal Extraction ───────────────────────────────────────────────

  private async *extractAndYieldProposals(
    recentMessages: RecentMessage[],
    category: "character" | "beat" | "bible",
  ): AsyncGenerator<OrchestratorEvent> {
    const prompt = buildProposalExtractorPrompt({
      recentMessages,
      category,
      topic: this.config.discussion.topic,
    });

    const result = await generateObject({
      model: this.config.smartModel,
      schema: proposalExtractionSchema,
      prompt,
    });

    for (const proposal of result.object.proposals) {
      const created = await this.config.repository.createProposal({
        discussion_id: this.config.discussion.id,
        category: proposal.category,
        title: proposal.title,
        description: proposal.description,
        proposed_content: proposal.proposed_content as Database["public"]["Tables"]["proposals"]["Insert"]["proposed_content"],
      });

      yield {
        type: "proposal",
        id: created.id,
        category: proposal.category,
        title: proposal.title,
        description: proposal.description,
        proposed_content: proposal.proposed_content,
      };
    }
  }

  // ── Agent Streaming ───────────────────────────────────────────────────

  private async *streamAgentResponse(
    agent: AgentRow,
    systemPrompt: string,
    conversationContext: string,
  ): AsyncGenerator<OrchestratorEvent> {
    const msgId = crypto.randomUUID();
    this.turnOrder++;

    yield {
      type: "agent-start",
      messageId: msgId,
      agentId: agent.id,
      agentName: agent.name,
      agentColor: agent.avatar_color,
      roundNumber: this.config.discussion.current_round,
      turnOrder: this.turnOrder,
    };

    let fullContent = "";
    const result = streamText({
      model: this.config.creativeModel,
      system: systemPrompt,
      prompt: conversationContext,
      temperature: 0.9,
    });

    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        fullContent += part.text;
        yield { type: "agent-delta", messageId: msgId, content: fullContent };
      }
    }

    yield { type: "agent-done", messageId: msgId };

    const persistedMessage = await this.config.repository.createMessage({
      discussion_id: this.config.discussion.id,
      agent_id: agent.id,
      round_number: this.config.discussion.current_round,
      turn_order: this.turnOrder,
      role: "agent",
      content: fullContent,
    });

    this.sessionMessages.push(persistedMessage);

    this.updateMemoryIndex(fullContent, agent.name).catch(() => {});
  }

  // ── Memory ────────────────────────────────────────────────────────────

  private async updateMemoryIndex(
    content: string,
    agentName: string,
  ): Promise<string[]> {
    const prompt = buildMemoryBrokerPrompt({
      messageContent: content,
      agentName,
      topic: this.config.discussion.topic,
    });

    const result = await generateObject({
      model: this.config.fastModel,
      schema: memoryExtractionSchema,
      prompt,
    });

    const entryIds: string[] = [];

    for (const entry of result.object.entries) {
      const created = await this.config.repository.createMemoryEntry({
        project_id: this.config.discussion.project_id,
        category: entry.category,
        keywords: entry.keywords,
        summary: entry.summary,
        importance: entry.importance,
        source_discussion_id: this.config.discussion.id,
        source_round: this.config.discussion.current_round,
      });

      entryIds.push(created.id);
    }

    return entryIds;
  }

  private async fetchRelevantMemories(
    agent: AgentRow,
  ): Promise<MemoryIndexRow[]> {
    const expertiseKeyword = agent.expertise.split(" ")[0];
    const topicKeyword = this.config.discussion.topic.split(" ")[0];
    const keywords = [expertiseKeyword, topicKeyword].filter(Boolean);

    try {
      return await this.config.repository.queryMemories(
        this.config.discussion.project_id,
        keywords,
        5,
      );
    } catch {
      return [];
    }
  }

  // ── Prompt Building ───────────────────────────────────────────────────

  private buildAgentPrompt(
    agent: AgentRow,
    memories: MemoryIndexRow[],
  ): string {
    const memoryContext = memories.map((m) => ({
      category: m.category,
      summary: m.summary,
    }));

    const approvedContent = this.config.approvedProposals.map((p) => ({
      category: p.category,
      title: p.title,
      description: p.description,
    }));

    return buildAgentSystemPrompt({
      agent: {
        name: agent.name,
        role: agent.role,
        expertise: agent.expertise,
        personality_traits: agent.personality_traits,
        writing_style: agent.writing_style,
      },
      topic: this.config.discussion.topic,
      memoryContext,
      approvedContent,
    });
  }

  private buildConversationContext(recentMessages: RecentMessage[]): string {
    if (recentMessages.length === 0) {
      return `This is the opening of the discussion. Be the first to speak on the topic: ${this.config.discussion.topic}`;
    }

    const formatted = recentMessages
      .map((m) => `[${m.agentName}]: ${m.content}`)
      .join("\n\n");

    return `The discussion so far (last few messages):\n\n${formatted}\n\nContinue the discussion on: ${this.config.discussion.topic}`;
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private getRecentMessages(): RecentMessage[] {
    const allMessages = [
      ...this.config.existingMessages,
      ...this.sessionMessages,
    ];

    return allMessages.slice(-RECENT_CONTEXT_COUNT).map((m) => ({
      agentName: this.resolveAgentName(m.agent_id),
      content: m.content,
    }));
  }

  private resolveAgentName(agentId: string | null): string {
    if (!agentId) {
      return "Showrunner";
    }

    const agent = this.config.agents.find((a) => a.id === agentId);
    return agent ? agent.name : "Unknown Writer";
  }

  private findAgent(agentId: string): AgentRow | undefined {
    return this.config.agents.find((a) => a.id === agentId);
  }

  private async *pauseDiscussion(): AsyncGenerator<OrchestratorEvent> {
    await this.config.repository.updateDiscussion(this.config.discussion.id, {
      status: "paused",
    });

    yield { type: "pause", messageCount: this.messageCount };
    yield { type: "done" };
  }
}
