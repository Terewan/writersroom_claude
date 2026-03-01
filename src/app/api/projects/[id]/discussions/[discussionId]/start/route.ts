import { NextResponse } from "next/server";
import {
  createWritersRoomProvider,
  getProviderForModel,
} from "@/lib/ai/provider";
import type { ProviderKey } from "@/lib/ai/provider";
import { DiscussionOrchestrator } from "@/lib/ai/orchestrator";
import { getServerRepository } from "@/lib/data/server-repository";
import { useDiscussionStore } from "@/stores/discussion-store";
import type { Database } from "@/types/database";

type DiscussionRow = Database["public"]["Tables"]["discussions"]["Row"];
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type DiscussionMessageRow =
  Database["public"]["Tables"]["discussion_messages"]["Row"];
type MemoryIndexRow = Database["public"]["Tables"]["memory_index"]["Row"];
type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];


export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; discussionId: string }> },
) {
  try {
    // Await params per Next.js 16 conventions (used for URL validation below)
    await params;

    // Gather API keys from headers (client-provided) or env
    const anthropicKey =
      request.headers.get("x-anthropic-key") ??
      process.env.ANTHROPIC_API_KEY ??
      "";
    const openaiKey =
      request.headers.get("x-openai-key") ??
      process.env.OPENAI_API_KEY ??
      "";
    const googleKey =
      request.headers.get("x-google-key") ??
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
      "";

    if (!anthropicKey && !openaiKey && !googleKey) {
      return NextResponse.json(
        { message: "No API key configured. Add one in Settings." },
        { status: 400 },
      );
    }

    // Get model preferences from headers
    const smartModel =
      request.headers.get("x-model-smart") ?? "sonnet";
    const creativeModel =
      request.headers.get("x-model-creative") ?? "sonnet";
    const fastModel =
      request.headers.get("x-model-fast") ?? "haiku";

    // Create provider
    const wrProvider = createWritersRoomProvider({
      anthropic: anthropicKey || undefined,
      openai: openaiKey || undefined,
      google: googleKey || undefined,
    });

    // Helper to resolve model with fallback to first available provider
    function resolveModel(alias: string) {
      const provider = getProviderForModel(alias);
      const keyMap: Record<ProviderKey, string> = {
        anthropic: anthropicKey,
        openai: openaiKey,
        google: googleKey,
      };
      if (provider && keyMap[provider]) {
        return wrProvider.languageModel(alias);
      }
      // Fallback: pick the first provider that has a key
      if (anthropicKey) return wrProvider.languageModel("sonnet");
      if (openaiKey) return wrProvider.languageModel("gpt-4o");
      return wrProvider.languageModel("gemini-2.0-flash");
    }

    // Read context from request body (client sends everything it knows)
    const body = await request.json() as {
      discussion?: DiscussionRow;
      agents?: AgentRow[];
      existingMessages?: DiscussionMessageRow[];
      existingMemories?: MemoryIndexRow[];
      approvedProposals?: ProposalRow[];
    };

    const discussion = body.discussion;
    const agents = body.agents;

    if (!discussion || !agents || agents.length < 2) {
      return NextResponse.json(
        { message: "Missing discussion/agents context or need at least 2 agents." },
        { status: 400 },
      );
    }

    const existingMessages = body.existingMessages ?? [];
    const existingMemories = body.existingMemories ?? [];
    const approvedProposals = (body.approvedProposals ?? []).filter(
      (p: ProposalRow) => p.status === "approved",
    );

    // Get repository for writes during the orchestrator run
    const repo = await getServerRepository();

    // In guest mode, seed the server-side store with the discussion
    // so orchestrator writes (updateDiscussion, etc.) don't throw
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const store = useDiscussionStore.getState();
      store.setDiscussion(discussion);
      for (const msg of existingMessages) {
        store.setMessage(msg);
      }
      for (const mem of existingMemories) {
        store.setMemoryEntry(mem);
      }
    }

    // Create orchestrator with context from request body
    const orchestrator = new DiscussionOrchestrator({
      smartModel: resolveModel(smartModel),
      creativeModel: resolveModel(creativeModel),
      fastModel: resolveModel(fastModel),
      agents,
      discussion,
      existingMessages,
      existingMemories,
      approvedProposals,
      repository: repo,
    });

    // Create SSE ReadableStream from the orchestrator generator
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const event of orchestrator.run()) {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch (error) {
          const errorData = `data: ${JSON.stringify({
            type: "error",
            message:
              error instanceof Error ? error.message : "Unknown error",
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to start discussion";
    return NextResponse.json({ message }, { status: 500 });
  }
}
