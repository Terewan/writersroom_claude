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

    // Step 1: Insert the project
    const { error: insertError } = await supabase
      .from("projects")
      .insert({ ...input, created_by: user.id });

    if (insertError) throw insertError;

    // The handle_new_project AFTER trigger has now fired and created
    // the project_members "owner" row, so the SELECT RLS policy passes.

    // Step 2: Fetch the newly created project
    const { data, error: selectError } = await supabase
      .from("projects")
      .select("*")
      .eq("created_by", user.id)
      .eq("title", input.title)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (selectError) throw selectError;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project";
    return NextResponse.json({ message }, { status: 500 });
  }
}
