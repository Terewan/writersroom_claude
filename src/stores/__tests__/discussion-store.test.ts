import { describe, it, expect, beforeEach } from "vitest";
import { useDiscussionStore } from "../discussion-store";
import type { Database } from "@/types/database";

type DiscussionRow = Database["public"]["Tables"]["discussions"]["Row"];
type DiscussionMessageRow = Database["public"]["Tables"]["discussion_messages"]["Row"];
type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];
type MemoryIndexRow = Database["public"]["Tables"]["memory_index"]["Row"];

const makeDiscussion = (overrides: Partial<DiscussionRow> = {}): DiscussionRow => ({
  id: "disc-1",
  project_id: "proj-1",
  topic: "Character arc for protagonist",
  max_rounds: 5,
  current_round: 0,
  status: "pending",
  summary: null,
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
  ...overrides,
});

const makeMessage = (overrides: Partial<DiscussionMessageRow> = {}): DiscussionMessageRow => ({
  id: "msg-1",
  discussion_id: "disc-1",
  agent_id: "agent-1",
  round_number: 1,
  turn_order: 1,
  role: "agent",
  content: "I think the protagonist needs more depth.",
  metadata: {},
  created_at: "2026-03-01T00:00:00Z",
  ...overrides,
});

const makeProposal = (overrides: Partial<ProposalRow> = {}): ProposalRow => ({
  id: "prop-1",
  discussion_id: "disc-1",
  category: "character",
  title: "Protagonist backstory",
  description: "Add a traumatic childhood event.",
  proposed_content: { name: "Alex", backstory: "Grew up in foster care" },
  status: "pending",
  user_notes: null,
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
  ...overrides,
});

const makeMemoryEntry = (overrides: Partial<MemoryIndexRow> = {}): MemoryIndexRow => ({
  id: "mem-1",
  project_id: "proj-1",
  category: "character",
  keywords: ["protagonist", "backstory"],
  summary: "Team agreed protagonist needs traumatic backstory.",
  source_discussion_id: "disc-1",
  source_round: 1,
  importance: 8,
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
  ...overrides,
});

function resetStore() {
  useDiscussionStore.setState({
    discussions: {},
    messages: {},
    proposals: {},
    memoryEntries: {},
  });
}

describe("useDiscussionStore", () => {
  beforeEach(resetStore);

  describe("discussions", () => {
    it("sets a discussion", () => {
      useDiscussionStore.getState().setDiscussion(makeDiscussion());
      expect(Object.keys(useDiscussionStore.getState().discussions)).toHaveLength(1);
      expect(useDiscussionStore.getState().discussions["disc-1"].topic).toBe(
        "Character arc for protagonist",
      );
    });

    it("updates an existing discussion", () => {
      useDiscussionStore.getState().setDiscussion(makeDiscussion());
      useDiscussionStore.getState().setDiscussion(
        makeDiscussion({ status: "running", current_round: 1 }),
      );
      const disc = useDiscussionStore.getState().discussions["disc-1"];
      expect(disc.status).toBe("running");
      expect(disc.current_round).toBe(1);
    });

    it("removes a discussion and its related data", () => {
      useDiscussionStore.getState().setDiscussion(makeDiscussion());
      useDiscussionStore.getState().setMessage(makeMessage());
      useDiscussionStore.getState().setProposal(makeProposal());
      useDiscussionStore.getState().setMemoryEntry(makeMemoryEntry());

      useDiscussionStore.getState().removeDiscussion("disc-1");

      const state = useDiscussionStore.getState();
      expect(Object.keys(state.discussions)).toHaveLength(0);
      expect(Object.keys(state.messages)).toHaveLength(0);
      expect(Object.keys(state.proposals)).toHaveLength(0);
      expect(Object.keys(state.memoryEntries)).toHaveLength(0);
    });

    it("preserves unrelated data when removing a discussion", () => {
      useDiscussionStore.getState().setDiscussion(makeDiscussion());
      useDiscussionStore.getState().setDiscussion(makeDiscussion({ id: "disc-2" }));
      useDiscussionStore.getState().setMessage(makeMessage({ id: "msg-other", discussion_id: "disc-2" }));

      useDiscussionStore.getState().removeDiscussion("disc-1");

      expect(Object.keys(useDiscussionStore.getState().discussions)).toHaveLength(1);
      expect(Object.keys(useDiscussionStore.getState().messages)).toHaveLength(1);
    });
  });

  describe("messages", () => {
    it("sets a message", () => {
      useDiscussionStore.getState().setMessage(makeMessage());
      expect(Object.keys(useDiscussionStore.getState().messages)).toHaveLength(1);
    });

    it("overwrites a message with the same id", () => {
      useDiscussionStore.getState().setMessage(makeMessage());
      useDiscussionStore.getState().setMessage(makeMessage({ content: "Updated content" }));
      expect(useDiscussionStore.getState().messages["msg-1"].content).toBe("Updated content");
    });
  });

  describe("proposals", () => {
    it("sets a proposal", () => {
      useDiscussionStore.getState().setProposal(makeProposal());
      expect(Object.keys(useDiscussionStore.getState().proposals)).toHaveLength(1);
      expect(useDiscussionStore.getState().proposals["prop-1"].category).toBe("character");
    });

    it("updates proposal status", () => {
      useDiscussionStore.getState().setProposal(makeProposal());
      useDiscussionStore.getState().setProposal(
        makeProposal({ status: "approved", user_notes: "Great idea!" }),
      );
      const prop = useDiscussionStore.getState().proposals["prop-1"];
      expect(prop.status).toBe("approved");
      expect(prop.user_notes).toBe("Great idea!");
    });
  });

  describe("memoryEntries", () => {
    it("sets a memory entry", () => {
      useDiscussionStore.getState().setMemoryEntry(makeMemoryEntry());
      expect(Object.keys(useDiscussionStore.getState().memoryEntries)).toHaveLength(1);
    });

    it("removes a memory entry", () => {
      useDiscussionStore.getState().setMemoryEntry(makeMemoryEntry());
      useDiscussionStore.getState().removeMemoryEntry("mem-1");
      expect(Object.keys(useDiscussionStore.getState().memoryEntries)).toHaveLength(0);
    });

    it("preserves other entries when removing one", () => {
      useDiscussionStore.getState().setMemoryEntry(makeMemoryEntry());
      useDiscussionStore.getState().setMemoryEntry(makeMemoryEntry({ id: "mem-2" }));
      useDiscussionStore.getState().removeMemoryEntry("mem-1");
      expect(Object.keys(useDiscussionStore.getState().memoryEntries)).toHaveLength(1);
      expect(useDiscussionStore.getState().memoryEntries["mem-2"]).toBeDefined();
    });
  });
});
