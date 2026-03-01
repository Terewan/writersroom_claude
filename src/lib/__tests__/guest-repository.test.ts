import { describe, it, expect, beforeEach } from "vitest";
import { GuestRepository } from "../data/guest-repository";
import { useProjectStore } from "@/stores/project-store";
import { useDiscussionStore } from "@/stores/discussion-store";

describe("GuestRepository", () => {
  let repo: GuestRepository;

  beforeEach(() => {
    useProjectStore.setState({ projects: {}, agents: {} });
    useDiscussionStore.setState({
      discussions: {},
      messages: {},
      proposals: {},
      memoryEntries: {},
    });
    repo = new GuestRepository();
  });

  describe("projects", () => {
    it("creates and lists projects", async () => {
      await repo.createProject({
        title: "Show A",
        show_idea: "Idea A",
        genre: "Drama",
        format: "tv_series",
      });
      await repo.createProject({
        title: "Show B",
        show_idea: "Idea B",
        genre: "Comedy",
        format: "feature_film",
      });

      const projects = await repo.listProjects();
      expect(projects).toHaveLength(2);
    });

    it("gets a project by id", async () => {
      const created = await repo.createProject({
        title: "My Show",
        show_idea: "Great idea",
        genre: "Thriller",
        format: "tv_series",
      });

      const found = await repo.getProject(created.id);
      expect(found?.title).toBe("My Show");
    });

    it("returns null for missing project", async () => {
      const found = await repo.getProject("nonexistent");
      expect(found).toBeNull();
    });

    it("updates a project", async () => {
      const created = await repo.createProject({
        title: "Original",
        show_idea: "Idea",
        genre: "Drama",
        format: "tv_series",
      });

      const updated = await repo.updateProject(created.id, { title: "Updated" });
      expect(updated.title).toBe("Updated");
      expect(updated.show_idea).toBe("Idea");
    });

    it("deletes a project", async () => {
      const created = await repo.createProject({
        title: "Delete Me",
        show_idea: "Idea",
        genre: "Horror",
        format: "custom",
      });

      await repo.deleteProject(created.id);
      const found = await repo.getProject(created.id);
      expect(found).toBeNull();
    });
  });

  describe("agents", () => {
    it("creates and lists agents for a project", async () => {
      const project = await repo.createProject({
        title: "Show",
        show_idea: "Idea",
        genre: "Drama",
        format: "tv_series",
      });

      await repo.createAgent({
        project_id: project.id,
        name: "Agent 1",
        role: "Writer",
        expertise: "Dialogue",
      });
      await repo.createAgent({
        project_id: project.id,
        name: "Agent 2",
        role: "Editor",
        expertise: "Structure",
      });

      const agents = await repo.listAgents(project.id);
      expect(agents).toHaveLength(2);
    });

    it("only returns agents for the requested project", async () => {
      await repo.createAgent({
        project_id: "proj-a",
        name: "A Agent",
        role: "Writer",
        expertise: "x",
      });
      await repo.createAgent({
        project_id: "proj-b",
        name: "B Agent",
        role: "Writer",
        expertise: "y",
      });

      const agents = await repo.listAgents("proj-a");
      expect(agents).toHaveLength(1);
      expect(agents[0].name).toBe("A Agent");
    });

    it("updates an agent", async () => {
      const agent = await repo.createAgent({
        project_id: "proj-1",
        name: "Original",
        role: "Writer",
        expertise: "x",
      });

      const updated = await repo.updateAgent(agent.id, { name: "Renamed" });
      expect(updated.name).toBe("Renamed");
      expect(updated.role).toBe("Writer");
    });

    it("deletes an agent", async () => {
      const agent = await repo.createAgent({
        project_id: "proj-1",
        name: "Delete Me",
        role: "Writer",
        expertise: "x",
      });

      await repo.deleteAgent(agent.id);
      const found = await repo.getAgent(agent.id);
      expect(found).toBeNull();
    });

    it("throws on update of nonexistent agent", async () => {
      await expect(
        repo.updateAgent("nonexistent", { name: "fail" }),
      ).rejects.toThrow("Agent nonexistent not found");
    });
  });

  describe("discussions", () => {
    it("creates and lists discussions", async () => {
      await repo.createDiscussion({
        project_id: "proj-1",
        topic: "Protagonist arc",
      });
      await repo.createDiscussion({
        project_id: "proj-1",
        topic: "Villain motivation",
      });

      const discussions = await repo.listDiscussions("proj-1");
      expect(discussions).toHaveLength(2);
    });

    it("only returns discussions for requested project", async () => {
      await repo.createDiscussion({ project_id: "proj-1", topic: "Topic A" });
      await repo.createDiscussion({ project_id: "proj-2", topic: "Topic B" });

      const discussions = await repo.listDiscussions("proj-1");
      expect(discussions).toHaveLength(1);
      expect(discussions[0].topic).toBe("Topic A");
    });

    it("gets a discussion by id", async () => {
      const created = await repo.createDiscussion({
        project_id: "proj-1",
        topic: "Character development",
      });

      const found = await repo.getDiscussion(created.id);
      expect(found?.topic).toBe("Character development");
    });

    it("returns null for missing discussion", async () => {
      const found = await repo.getDiscussion("nonexistent");
      expect(found).toBeNull();
    });

    it("updates a discussion", async () => {
      const created = await repo.createDiscussion({
        project_id: "proj-1",
        topic: "Original topic",
      });

      const updated = await repo.updateDiscussion(created.id, {
        status: "running",
        current_round: 2,
      });
      expect(updated.status).toBe("running");
      expect(updated.current_round).toBe(2);
      expect(updated.topic).toBe("Original topic");
    });

    it("throws on update of nonexistent discussion", async () => {
      await expect(
        repo.updateDiscussion("nonexistent", { status: "running" }),
      ).rejects.toThrow("Discussion nonexistent not found");
    });
  });

  describe("messages", () => {
    it("creates and lists messages sorted by round/turn", async () => {
      await repo.createMessage({
        discussion_id: "disc-1",
        round_number: 1,
        turn_order: 2,
        role: "agent",
        content: "Second message",
      });
      await repo.createMessage({
        discussion_id: "disc-1",
        round_number: 1,
        turn_order: 1,
        role: "agent",
        content: "First message",
      });

      const messages = await repo.listMessages("disc-1");
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe("First message");
      expect(messages[1].content).toBe("Second message");
    });

    it("only returns messages for the requested discussion", async () => {
      await repo.createMessage({
        discussion_id: "disc-1",
        round_number: 1,
        turn_order: 1,
        role: "agent",
        content: "Disc 1 msg",
      });
      await repo.createMessage({
        discussion_id: "disc-2",
        round_number: 1,
        turn_order: 1,
        role: "agent",
        content: "Disc 2 msg",
      });

      const messages = await repo.listMessages("disc-1");
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe("Disc 1 msg");
    });
  });

  describe("proposals", () => {
    it("creates and lists proposals", async () => {
      await repo.createProposal({
        discussion_id: "disc-1",
        category: "character",
        title: "New character",
        description: "A new sidekick",
      });

      const proposals = await repo.listProposals("disc-1");
      expect(proposals).toHaveLength(1);
      expect(proposals[0].status).toBe("pending");
    });

    it("updates a proposal status", async () => {
      const created = await repo.createProposal({
        discussion_id: "disc-1",
        category: "beat",
        title: "Plot twist",
        description: "Reveal the villain is the hero's sibling",
      });

      const updated = await repo.updateProposal(created.id, {
        status: "approved",
        user_notes: "Love it!",
      });
      expect(updated.status).toBe("approved");
      expect(updated.user_notes).toBe("Love it!");
    });

    it("throws on update of nonexistent proposal", async () => {
      await expect(
        repo.updateProposal("nonexistent", { status: "rejected" }),
      ).rejects.toThrow("Proposal nonexistent not found");
    });
  });

  describe("memory index", () => {
    it("creates and lists memory entries", async () => {
      await repo.createMemoryEntry({
        project_id: "proj-1",
        category: "character",
        summary: "Protagonist is named Alex",
        keywords: ["alex", "protagonist"],
      });

      const entries = await repo.listMemories("proj-1");
      expect(entries).toHaveLength(1);
    });

    it("queries memories by keyword overlap", async () => {
      await repo.createMemoryEntry({
        project_id: "proj-1",
        category: "character",
        summary: "Alex is brave",
        keywords: ["alex", "brave", "protagonist"],
        importance: 8,
      });
      await repo.createMemoryEntry({
        project_id: "proj-1",
        category: "plot",
        summary: "The heist happens at midnight",
        keywords: ["heist", "midnight", "plot"],
        importance: 6,
      });
      await repo.createMemoryEntry({
        project_id: "proj-1",
        category: "character",
        summary: "Alex fears heights",
        keywords: ["alex", "fear", "heights"],
        importance: 7,
      });

      const results = await repo.queryMemories("proj-1", ["alex"], 5);
      expect(results).toHaveLength(2);
      // "Alex is brave" has keyword overlap + higher importance → ranked first
      expect(results[0].summary).toBe("Alex is brave");
    });

    it("returns top entries by importance when no keywords", async () => {
      await repo.createMemoryEntry({
        project_id: "proj-1",
        category: "plot",
        summary: "Low importance",
        keywords: ["plot"],
        importance: 2,
      });
      await repo.createMemoryEntry({
        project_id: "proj-1",
        category: "character",
        summary: "High importance",
        keywords: ["character"],
        importance: 9,
      });

      const results = await repo.queryMemories("proj-1", [], 5);
      expect(results).toHaveLength(2);
      expect(results[0].summary).toBe("High importance");
    });

    it("respects the limit parameter", async () => {
      for (let i = 0; i < 10; i++) {
        await repo.createMemoryEntry({
          project_id: "proj-1",
          category: "misc",
          summary: `Entry ${i}`,
          keywords: ["shared"],
          importance: i,
        });
      }

      const results = await repo.queryMemories("proj-1", ["shared"], 3);
      expect(results).toHaveLength(3);
    });
  });
});
