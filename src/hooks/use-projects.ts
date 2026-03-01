import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDataRepository } from "./use-data-repository";
import type { CreateProjectInput } from "@/lib/validators";
import type { Database } from "@/types/database";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export function useProjects() {
  const repo = useDataRepository();
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => repo.listProjects(),
  });
}

export function useProject(id: string) {
  const repo = useDataRepository();
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => repo.getProject(id),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const repo = useDataRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput): Promise<ProjectRow> => {
      // When Supabase is configured, use the API route (server-side)
      // so auth cookies are properly handled via Next.js cookies()
      if (hasSupabase) {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `HTTP ${res.status}`);
        }
        return res.json();
      }
      // Guest mode: use the repository directly (localStorage)
      return repo.createProject(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const repo = useDataRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => repo.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
