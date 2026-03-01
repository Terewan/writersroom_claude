import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDataRepository } from "./use-data-repository";
import { useSettingsStore } from "@/stores/settings-store";
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
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const modelConfig = useSettingsStore((s) => s.modelConfig);

  return useMutation({
    mutationFn: async (input: {
      show_idea: string;
      genre: string;
      format: "tv_series" | "feature_film" | "custom";
    }): Promise<SuggestAgentsResponse> => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Send API keys so the server can use the user's chosen provider
      if (apiKeys.anthropic) headers["x-anthropic-key"] = apiKeys.anthropic;
      if (apiKeys.openai) headers["x-openai-key"] = apiKeys.openai;
      if (apiKeys.google) headers["x-google-key"] = apiKeys.google;

      // Send the user's chosen "smart" model for AI generation tasks
      headers["x-model"] = modelConfig.smart;

      const response = await fetch(`/api/projects/${projectId}/agents/suggest`, {
        method: "POST",
        headers,
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
