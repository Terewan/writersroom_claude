import { describe, it, expect, beforeEach } from "vitest";
import { GuestRepository } from "../data/guest-repository";
import { useProjectStore } from "@/stores/project-store";

describe("GuestRepository", () => {
  let repo: GuestRepository;

  beforeEach(() => {
    useProjectStore.setState({ projects: {}, agents: {} });
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
});
