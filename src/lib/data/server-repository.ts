import { createClient } from "@/lib/supabase/server";
import { SupabaseRepository } from "./supabase-repository";
import { GuestRepository } from "./guest-repository";
import type { DataRepository } from "./repository";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a DataRepository for use in API routes (server-side).
 * When Supabase is configured, uses the server-side client (reads cookies
 * via Next.js cookies()) so the auth session is available.
 */
export async function getServerRepository(): Promise<DataRepository> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const client = await createClient();
    return new SupabaseRepository(client as SupabaseClient);
  }
  return new GuestRepository();
}
