import { NextResponse } from "next/server";
import { updateAgentSchema } from "@/lib/validators";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; agentId: string }> },
) {
  try {
    const { agentId } = await params;
    const supabase = await createClient() as SupabaseClient;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = updateAgentSchema.parse(body);

    const { data, error } = await supabase
      .from("agents")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", agentId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update agent";
    return NextResponse.json({ message }, { status: 500 });
  }
}
