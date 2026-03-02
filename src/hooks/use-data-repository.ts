import { useMemo } from "react";
import type { DataRepository } from "@/lib/data/repository";
import { GuestRepository } from "@/lib/data/guest-repository";
import { SupabaseRepository } from "@/lib/data/supabase-repository";
import { createClient } from "@/lib/supabase/client";

const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export function useDataRepository(): DataRepository {
  return useMemo(() => {
    if (hasSupabase) {
      return new SupabaseRepository(createClient());
    }
    return new GuestRepository();
  }, []);
}
