import { NextResponse } from "next/server";
import { userMessageSchema } from "@/lib/validators";
import { getServerRepository } from "@/lib/data/server-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; discussionId: string }> },
) {
  try {
    const { discussionId } = await params;
    const body = await request.json();
    const input = userMessageSchema.parse(body);

    const repo = await getServerRepository();

    // Get current discussion for round number
    const discussion = await repo.getDiscussion(discussionId);
    if (!discussion) {
      return NextResponse.json(
        { message: "Discussion not found" },
        { status: 404 },
      );
    }

    // Get current message count for turn ordering
    const existingMessages = await repo.listMessages(discussionId);
    const turnOrder = existingMessages.length + 1;

    const message = await repo.createMessage({
      discussion_id: discussionId,
      agent_id: null,
      round_number: discussion.current_round,
      turn_order: turnOrder,
      role: "showrunner",
      content: input.content,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ message }, { status: 500 });
  }
}
