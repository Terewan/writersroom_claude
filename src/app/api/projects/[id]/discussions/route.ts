import { NextResponse } from "next/server";
import { createDiscussionSchema } from "@/lib/validators";
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const input = createDiscussionSchema.parse({
      ...body,
      project_id: projectId,
    });

    const repo = getRepository();
    const discussion = await repo.createDiscussion(input);
    return NextResponse.json(discussion, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create discussion";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const repo = getRepository();
    const discussions = await repo.listDiscussions(projectId);
    return NextResponse.json(discussions);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list discussions";
    return NextResponse.json({ message }, { status: 500 });
  }
}
