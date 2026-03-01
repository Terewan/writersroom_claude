import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Database } from "@/types/database";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];

interface ProjectStoreState {
  projects: Record<string, ProjectRow>;
  agents: Record<string, AgentRow>;

  setProject: (project: ProjectRow) => void;
  removeProject: (id: string) => void;

  setAgent: (agent: AgentRow) => void;
  removeAgent: (id: string) => void;
}

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set) => ({
      projects: {},
      agents: {},

      setProject: (project) =>
        set((state) => ({
          projects: { ...state.projects, [project.id]: project },
        })),

      removeProject: (id) =>
        set((state) => {
          const { [id]: _removed, ...rest } = state.projects;
          void _removed;
          // Also remove agents belonging to this project
          const agents = Object.fromEntries(
            Object.entries(state.agents).filter(
              ([, agent]) => agent.project_id !== id,
            ),
          );
          return { projects: rest, agents };
        }),

      setAgent: (agent) =>
        set((state) => ({
          agents: { ...state.agents, [agent.id]: agent },
        })),

      removeAgent: (id) =>
        set((state) => {
          const { [id]: _removed, ...rest } = state.agents;
          void _removed;
          return { agents: rest };
        }),
    }),
    {
      name: "writers-room-projects",
    },
  ),
);
