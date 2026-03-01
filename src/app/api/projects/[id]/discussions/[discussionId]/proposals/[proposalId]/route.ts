import { NextResponse } from "next/server";
import { updateProposalSchema } from "@/lib/validators";
import { getServerRepository } from "@/lib/data/server-repository";
import type { Json } from "@/types/database";

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      discussionId: string;
      proposalId: string;
    }>;
  },
) {
  try {
    const { id: projectId, proposalId } = await params;
    const body = await request.json();
    const input = updateProposalSchema.parse(body);

    const repo = await getServerRepository();

    // Cast proposed_content from Record<string, unknown> to Json for DB compatibility
    const updatePayload = {
      ...input,
      proposed_content: input.proposed_content as Json | undefined,
    };
    const updated = await repo.updateProposal(proposalId, updatePayload);

    // If approved, apply the proposal to the appropriate entity
    if (input.status === "approved" && updated.proposed_content) {
      const content = updated.proposed_content as Record<string, Json | undefined>;

      if (
        updated.category === "character" &&
        typeof content.name === "string"
      ) {
        await repo.createCharacter({
          project_id: projectId,
          name: content.name,
          role: typeof content.role === "string" ? content.role : "",
          bio: content as Json,
        });
      } else if (
        updated.category === "bible" &&
        typeof content.title === "string"
      ) {
        await repo.createBibleSection({
          project_id: projectId,
          section_type:
            typeof content.section_type === "string"
              ? content.section_type
              : "general",
          title: content.title,
          content: content as Json,
        });
      }
      // "beat" proposals require episode/act context — stored for later application
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update proposal";
    return NextResponse.json({ message }, { status: 500 });
  }
}
