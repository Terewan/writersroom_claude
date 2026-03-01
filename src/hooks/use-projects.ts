import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDataRepository } from "./use-data-repository";
import type { CreateProjectInput } from "@/lib/validators";

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
    mutationFn: (input: CreateProjectInput) => repo.createProject(input),
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
