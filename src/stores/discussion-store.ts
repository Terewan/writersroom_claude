import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Database } from "@/types/database";

type DiscussionRow = Database["public"]["Tables"]["discussions"]["Row"];
type DiscussionMessageRow = Database["public"]["Tables"]["discussion_messages"]["Row"];
type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];
type MemoryIndexRow = Database["public"]["Tables"]["memory_index"]["Row"];

interface DiscussionStoreState {
  discussions: Record<string, DiscussionRow>;
  messages: Record<string, DiscussionMessageRow>;
  proposals: Record<string, ProposalRow>;
  memoryEntries: Record<string, MemoryIndexRow>;

  setDiscussion: (discussion: DiscussionRow) => void;
  removeDiscussion: (id: string) => void;

  setMessage: (message: DiscussionMessageRow) => void;

  setProposal: (proposal: ProposalRow) => void;

  setMemoryEntry: (entry: MemoryIndexRow) => void;
  removeMemoryEntry: (id: string) => void;
}

export const useDiscussionStore = create<DiscussionStoreState>()(
  persist(
    (set) => ({
      discussions: {},
      messages: {},
      proposals: {},
      memoryEntries: {},

      setDiscussion: (discussion) =>
        set((state) => ({
          discussions: { ...state.discussions, [discussion.id]: discussion },
        })),

      removeDiscussion: (id) =>
        set((state) => {
          const { [id]: _removed, ...restDiscussions } = state.discussions;
          void _removed;
          // Also remove messages, proposals, and memory entries for this discussion
          const messages = Object.fromEntries(
            Object.entries(state.messages).filter(
              ([, msg]) => msg.discussion_id !== id,
            ),
          );
          const proposals = Object.fromEntries(
            Object.entries(state.proposals).filter(
              ([, p]) => p.discussion_id !== id,
            ),
          );
          const memoryEntries = Object.fromEntries(
            Object.entries(state.memoryEntries).filter(
              ([, m]) => m.source_discussion_id !== id,
            ),
          );
          return { discussions: restDiscussions, messages, proposals, memoryEntries };
        }),

      setMessage: (message) =>
        set((state) => ({
          messages: { ...state.messages, [message.id]: message },
        })),

      setProposal: (proposal) =>
        set((state) => ({
          proposals: { ...state.proposals, [proposal.id]: proposal },
        })),

      setMemoryEntry: (entry) =>
        set((state) => ({
          memoryEntries: { ...state.memoryEntries, [entry.id]: entry },
        })),

      removeMemoryEntry: (id) =>
        set((state) => {
          const { [id]: _removed, ...rest } = state.memoryEntries;
          void _removed;
          return { memoryEntries: rest };
        }),
    }),
    {
      name: "writers-room-discussions",
    },
  ),
);
