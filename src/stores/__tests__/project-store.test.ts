import { describe, it, expect, beforeEach } from "vitest";
import { useProjectStore } from "../project-store";
import type { Database } from "@/types/database";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];

const makeProject = (overrides: Partial<ProjectRow> = {}): ProjectRow => ({
  id: "proj-1",
  title: "Test Show",
  show_idea: "A test show idea",
  genre: "Drama",
  format: "tv_series",
  status: "draft",
  created_by: "guest",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const makeAgent = (overrides: Partial<AgentRow> = {}): AgentRow => ({
  id: "agent-1",
  project_id: "proj-1",
  name: "Test Agent",
  role: "Writer",
  expertise: "Testing",
  personality_traits: ["diligent"],
  writing_style: "Precise",
  avatar_color: "#f59e0b",
  model_override: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("project-store", () => {
  beforeEach(() => {
    useProjectStore.setState({ projects: {}, agents: {} });
  });

  describe("projects", () => {
    it("sets a project", () => {
      const project = makeProject();
      useProjectStore.getState().setProject(project);
      expect(useProjectStore.getState().projects["proj-1"]).toEqual(project);
    });

    it("overwrites an existing project", () => {
      useProjectStore.getState().setProject(makeProject());
      useProjectStore.getState().setProject(makeProject({ title: "Updated" }));
      expect(useProjectStore.getState().projects["proj-1"].title).toBe("Updated");
    });

    it("removes a project", () => {
      useProjectStore.getState().setProject(makeProject());
      useProjectStore.getState().removeProject("proj-1");
      expect(useProjectStore.getState().projects["proj-1"]).toBeUndefined();
    });

    it("removes associated agents when project is deleted", () => {
      useProjectStore.getState().setProject(makeProject());
      useProjectStore.getState().setAgent(makeAgent());
      useProjectStore.getState().setAgent(makeAgent({ id: "agent-2", project_id: "proj-2" }));

      useProjectStore.getState().removeProject("proj-1");
      expect(Object.keys(useProjectStore.getState().agents)).toEqual(["agent-2"]);
    });
  });

  describe("agents", () => {
    it("sets an agent", () => {
      const agent = makeAgent();
      useProjectStore.getState().setAgent(agent);
      expect(useProjectStore.getState().agents["agent-1"]).toEqual(agent);
    });

    it("removes an agent", () => {
      useProjectStore.getState().setAgent(makeAgent());
      useProjectStore.getState().removeAgent("agent-1");
      expect(useProjectStore.getState().agents["agent-1"]).toBeUndefined();
    });

    it("handles multiple agents for a project", () => {
      useProjectStore.getState().setAgent(makeAgent({ id: "a1" }));
      useProjectStore.getState().setAgent(makeAgent({ id: "a2" }));
      useProjectStore.getState().setAgent(makeAgent({ id: "a3" }));

      const agents = useProjectStore.getState().agents;
      const projectAgents = Object.values(agents).filter(
        (a) => a.project_id === "proj-1",
      );
      expect(projectAgents).toHaveLength(3);
    });
  });
});
