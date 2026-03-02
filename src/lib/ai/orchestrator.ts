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
    agentRole: string;
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
  | {
    type: "prompt-log";
    id: string;
    callType: "orchestrator" | "proposal" | "agent" | "memory";
    label: string;
    modelAlias: string;
    promptText: string;
    timestamp: number;
  }
  | {
    type: "prompt-log-response";
    id: string;
    responseText: string;
    timestamp: number;
  }
  | { type: "error"; message: string }
  | { type: "done" };

// ── Config ────────────────────────────────────────────────────────────────

interface OrchestratorConfig {
  smartModel: LanguageModelV3;
  creativeModel: LanguageModelV3;
  fastModel: LanguageModelV3;
  smartModelAlias: string;
  creativeModelAlias: string;
  fastModelAlias: string;
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
const RECENT_CONTEXT_COUNT = 20;

// ── Orchestrator ──────────────────────────────────────────────────────────

export class DiscussionOrchestrator {
  private config: OrchestratorConfig;
  private messageCount: number;
  private turnOrder: number;
  private sessionMessages: DiscussionMessageRow[];
  private lastSpeakerAgentId: string | null;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.messageCount = config.existingMessages.length;
    this.turnOrder = config.existingMessages.length;
    this.sessionMessages = [];

    // Initialize from the last existing message so we never self-reply on resume
    const lastMsg = config.existingMessages.at(-1);
    this.lastSpeakerAgentId = lastMsg?.agent_id ?? null;
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

      const decision = yield* this.askOrchestrator(recentMessages);

      if (decision.should_pause || this.messageCount >= startingCount + MAX_MESSAGES_PER_RUN) {
        // Extract proposals before pausing so the user sees them with the pause
        if (decision.should_propose && decision.proposal_category) {
          yield* this.extractAndYieldProposals(
            recentMessages,
            decision.proposal_category,
          );
        }
        yield* this.pauseDiscussion();
        return;
      }

      let selectedAgent = this.findAgent(decision.next_agent_id);

      // Hard guard: never let the same agent speak twice in a row
      if (selectedAgent && selectedAgent.id === this.lastSpeakerAgentId) {
        const otherAgents = this.config.agents.filter(
          (a) => a.id !== this.lastSpeakerAgentId && a.is_active,
        );
        selectedAgent = otherAgents.length > 0
          ? otherAgents[Math.floor(Math.random() * otherAgents.length)]
          : undefined;
      }

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

      this.lastSpeakerAgentId = selectedAgent.id;
      this.messageCount++;

      // Extract proposals AFTER the agent speaks (so the user doesn't see
      // a proposal card while the agent bubble still shows "...")
      if (decision.should_propose && decision.proposal_category) {
        yield* this.extractAndYieldProposals(
          this.getRecentMessages(),
          decision.proposal_category,
        );
      }
    }

    yield* this.pauseDiscussion();
  }

  // ── Orchestrator Decision ─────────────────────────────────────────────

  private async *askOrchestrator(recentMessages: RecentMessage[]) {
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
      lastSpeakerAgentId: this.lastSpeakerAgentId,
    });

    const logId = crypto.randomUUID();
    yield {
      type: "prompt-log" as const,
      id: logId,
      callType: "orchestrator" as const,
      label: "Who speaks next?",
      modelAlias: this.config.smartModelAlias,
      promptText: prompt,
      timestamp: Date.now(),
    };

    const result = await generateObject({
      model: this.config.smartModel,
      schema: orchestratorDecisionSchema,
      prompt,
    });

    yield {
      type: "prompt-log-response" as const,
      id: logId,
      responseText: JSON.stringify(result.object, null, 2),
      timestamp: Date.now(),
    };

    return result.object;
  }

  // ── Proposal Extraction ───────────────────────────────────────────────

  private async *extractAndYieldProposals(
    recentMessages: RecentMessage[],
    category: "character" | "beat" | "bible",
  ): AsyncGenerator<OrchestratorEvent> {
    const approvedTitles = this.config.approvedProposals.map((p) => p.title);
    const prompt = buildProposalExtractorPrompt({
      recentMessages,
      category,
      topic: this.config.discussion.topic,
      approvedTitles,
    });

    const logId = crypto.randomUUID();
    yield {
      type: "prompt-log" as const,
      id: logId,
      callType: "proposal" as const,
      label: `Extract ${category} proposals`,
      modelAlias: this.config.smartModelAlias,
      promptText: prompt,
      timestamp: Date.now(),
    };

    const result = await generateObject({
      model: this.config.smartModel,
      schema: proposalExtractionSchema,
      prompt,
    });

    yield {
      type: "prompt-log-response" as const,
      id: logId,
      responseText: JSON.stringify(result.object, null, 2),
      timestamp: Date.now(),
    };

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

    const logId = crypto.randomUUID();
    yield {
      type: "prompt-log" as const,
      id: logId,
      callType: "agent" as const,
      label: `${agent.name} responds`,
      modelAlias: this.config.creativeModelAlias,
      promptText: `[SYSTEM]\n${systemPrompt}\n\n[USER]\n${conversationContext}`,
      timestamp: Date.now(),
    };

    yield {
      type: "agent-start",
      messageId: msgId,
      agentId: agent.id,
      agentName: agent.name,
      agentRole: agent.role,
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

    yield {
      type: "prompt-log-response" as const,
      id: logId,
      responseText: fullContent,
      timestamp: Date.now(),
    };

    const persistedMessage = await this.config.repository.createMessage({
      discussion_id: this.config.discussion.id,
      agent_id: agent.id,
      round_number: this.config.discussion.current_round,
      turn_order: this.turnOrder,
      role: "agent",
      content: fullContent,
    });

    this.sessionMessages.push(persistedMessage);

    yield* this.updateMemoryIndex(fullContent, agent.name);
  }

  // ── Memory ────────────────────────────────────────────────────────────

  private async *updateMemoryIndex(
    content: string,
    agentName: string,
  ): AsyncGenerator<OrchestratorEvent> {
    const prompt = buildMemoryBrokerPrompt({
      messageContent: content,
      agentName,
      topic: this.config.discussion.topic,
    });

    const logId = crypto.randomUUID();
    yield {
      type: "prompt-log" as const,
      id: logId,
      callType: "memory" as const,
      label: `Index memories for ${agentName}`,
      modelAlias: this.config.fastModelAlias,
      promptText: prompt,
      timestamp: Date.now(),
    };

    try {
      const result = await generateObject({
        model: this.config.fastModel,
        schema: memoryExtractionSchema,
        prompt,
      });

      yield {
        type: "prompt-log-response" as const,
        id: logId,
        responseText: JSON.stringify(result.object, null, 2),
        timestamp: Date.now(),
      };

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

        yield { type: "memory-updated", entryId: created.id };
      }
    } catch {
      // Memory indexing is non-critical — log failure but don't break the run
      yield {
        type: "prompt-log-response" as const,
        id: logId,
        responseText: "[error] Memory extraction failed",
        timestamp: Date.now(),
      };
    }
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

    return `The discussion so far:\n\n${formatted}\n\nRespond to the conversation naturally in character.`;
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
