import { NextResponse } from "next/server";
import {
  createWritersRoomProvider,
  getProviderForModel,
} from "@/lib/ai/provider";
import type { ProviderKey } from "@/lib/ai/provider";
import { DiscussionOrchestrator } from "@/lib/ai/orchestrator";
import { GuestRepository } from "@/lib/data/guest-repository";
import { SupabaseRepository } from "@/lib/data/supabase-repository";
import type { DataRepository } from "@/lib/data/repository";

function getRepository(): DataRepository {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new SupabaseRepository();
  }
  return new GuestRepository();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; discussionId: string }> },
) {
  try {
    const { id: projectId, discussionId } = await params;

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

    // Load discussion context from repository
    const repo = getRepository();
    const discussion = await repo.getDiscussion(discussionId);
    if (!discussion) {
      return NextResponse.json(
        { message: "Discussion not found" },
        { status: 404 },
      );
    }

    // Load agents for the project
    const agents = await repo.listAgents(projectId);
    if (agents.length < 2) {
      return NextResponse.json(
        { message: "Need at least 2 agents to start a discussion." },
        { status: 400 },
      );
    }

    // Load existing messages, memories, and proposals for context continuity
    const existingMessages = await repo.listMessages(discussionId);
    const existingMemories = await repo.listMemories(projectId);
    const proposals = await repo.listProposals(discussionId);
    const approvedProposals = proposals.filter(
      (p) => p.status === "approved",
    );

    // Create orchestrator
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
