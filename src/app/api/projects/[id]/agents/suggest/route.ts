import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { suggestAgentsSchema, suggestAgentsResponseSchema } from "@/lib/validators";
import { createWritersRoomProvider } from "@/lib/ai/provider";
import { buildSuggestAgentsPrompt } from "@/lib/ai/prompts/suggest-agents";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = suggestAgentsSchema.parse(body);

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

    const provider = createWritersRoomProvider({
      anthropic: anthropicKey || undefined,
      openai: openaiKey || undefined,
      google: googleKey || undefined,
    });

    // Pick the best available model
    const modelId = anthropicKey ? "sonnet" : openaiKey ? "gpt-4o" : "gemini-pro";

    const prompt = buildSuggestAgentsPrompt({
      showIdea: input.show_idea,
      genre: input.genre,
      format: input.format,
    });

    const { object } = await generateObject({
      model: provider.languageModel(modelId),
      schema: suggestAgentsResponseSchema,
      prompt,
    });

    return NextResponse.json(object);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to suggest agents";
    return NextResponse.json({ message }, { status: 500 });
  }
}
