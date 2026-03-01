import { NextResponse } from "next/server";
import { createProjectSchema } from "@/lib/validators";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabase = await createClient() as SupabaseClient;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = createProjectSchema.parse(body);

    const { data, error } = await supabase
      .from("projects")
      .insert({ ...input, created_by: user.id })
      .select()
      .single();

    if (error) throw error;

    // Create project_members entry for owner
    const projectData = data as Record<string, unknown>;
    await supabase
      .from("project_members")
      .insert({ project_id: projectData.id, user_id: user.id, role: "owner" });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project";
    return NextResponse.json({ message }, { status: 500 });
  }
}
