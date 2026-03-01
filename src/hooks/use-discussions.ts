import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDataRepository } from "./use-data-repository";
import type { Database } from "@/types/database";

type DiscussionInsert = Database["public"]["Tables"]["discussions"]["Insert"];
type ProposalUpdate = Database["public"]["Tables"]["proposals"]["Update"];

export function useDiscussions(projectId: string) {
  const repo = useDataRepository();
  return useQuery({
    queryKey: ["discussions", projectId],
    queryFn: () => repo.listDiscussions(projectId),
    enabled: Boolean(projectId),
  });
}

export function useDiscussion(id: string) {
  const repo = useDataRepository();
  return useQuery({
    queryKey: ["discussion", id],
    queryFn: () => repo.getDiscussion(id),
    enabled: Boolean(id),
  });
}

export function useDiscussionMessages(discussionId: string) {
  const repo = useDataRepository();
  return useQuery({
    queryKey: ["discussion-messages", discussionId],
    queryFn: () => repo.listMessages(discussionId),
    enabled: Boolean(discussionId),
  });
}

export function useCreateDiscussion(projectId: string) {
  const repo = useDataRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Pick<DiscussionInsert, "project_id" | "topic" | "max_rounds">) =>
      repo.createDiscussion(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions", projectId] });
    },
  });
}

export function useUpdateProposal(discussionId: string) {
  const repo = useDataRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProposalUpdate }) =>
      repo.updateProposal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals", discussionId] });
    },
  });
}

export function useProposals(discussionId: string) {
  const repo = useDataRepository();
  return useQuery({
    queryKey: ["proposals", discussionId],
    queryFn: () => repo.listProposals(discussionId),
    enabled: Boolean(discussionId),
  });
}
