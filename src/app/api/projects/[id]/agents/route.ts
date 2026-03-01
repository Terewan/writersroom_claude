import { NextResponse } from "next/server";
import { createAgentSchema } from "@/lib/validators";
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
    const input = createAgentSchema.parse(body);

    const { data, error } = await supabase
      .from("agents")
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create agent";
    return NextResponse.json({ message }, { status: 500 });
  }
}
