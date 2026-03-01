import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDataRepository } from "./use-data-repository";
import type { CreateAgentInput, UpdateAgentInput, SuggestAgentsResponse } from "@/lib/validators";

export function useAgents(projectId: string) {
  const repo = useDataRepository();
  return useQuery({
    queryKey: ["agents", projectId],
    queryFn: () => repo.listAgents(projectId),
    enabled: Boolean(projectId),
  });
}

export function useCreateAgent() {
  const repo = useDataRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAgentInput) => repo.createAgent(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agents", variables.project_id] });
    },
  });
}

export function useUpdateAgent(projectId: string) {
  const repo = useDataRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentInput }) =>
      repo.updateAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", projectId] });
    },
  });
}

export function useDeleteAgent(projectId: string) {
  const repo = useDataRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => repo.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", projectId] });
    },
  });
}

export function useSuggestAgents(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      show_idea: string;
      genre: string;
      format: "tv_series" | "feature_film" | "custom";
    }): Promise<SuggestAgentsResponse> => {
      const response = await fetch(`/api/projects/${projectId}/agents/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to suggest agents" }));
        throw new Error(error.message ?? "Failed to suggest agents");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", projectId] });
    },
  });
}
