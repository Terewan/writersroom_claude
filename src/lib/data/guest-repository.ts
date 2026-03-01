import type { Database } from "@/types/database";
import type { DataRepository } from "./repository";
import { useProjectStore } from "@/stores/project-store";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

function getStore() {
  return useProjectStore.getState();
}

export class GuestRepository implements DataRepository {
  async listProjects(): Promise<ProjectRow[]> {
    const { projects } = getStore();
    return Object.values(projects).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  async getProject(id: string): Promise<ProjectRow | null> {
    return getStore().projects[id] ?? null;
  }

  async createProject(data: ProjectInsert): Promise<ProjectRow> {
    const now = new Date().toISOString();
    const project: ProjectRow = {
      id: data.id ?? crypto.randomUUID(),
      title: data.title,
      show_idea: data.show_idea,
      genre: data.genre,
      format: data.format,
      status: data.status ?? "draft",
      created_by: data.created_by ?? "guest",
      created_at: data.created_at ?? now,
      updated_at: data.updated_at ?? now,
    };
    getStore().setProject(project);
    return project;
  }

  async updateProject(id: string, data: ProjectUpdate): Promise<ProjectRow> {
    const existing = getStore().projects[id];
    if (!existing) throw new Error(`Project ${id} not found`);
    const updated: ProjectRow = {
      ...existing,
      ...data,
      id: existing.id,
      updated_at: new Date().toISOString(),
    };
    getStore().setProject(updated);
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    getStore().removeProject(id);
  }

  async listAgents(projectId: string): Promise<AgentRow[]> {
    const { agents } = getStore();
    return Object.values(agents)
      .filter((a) => a.project_id === projectId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async getAgent(id: string): Promise<AgentRow | null> {
    return getStore().agents[id] ?? null;
  }

  async createAgent(data: AgentInsert): Promise<AgentRow> {
    const now = new Date().toISOString();
    const agent: AgentRow = {
      id: data.id ?? crypto.randomUUID(),
      project_id: data.project_id,
      name: data.name,
      role: data.role,
      expertise: data.expertise,
      personality_traits: data.personality_traits ?? [],
      writing_style: data.writing_style ?? "",
      avatar_color: data.avatar_color ?? "#f59e0b",
      model_override: data.model_override ?? null,
      is_active: data.is_active ?? true,
      created_at: now,
      updated_at: now,
    };
    getStore().setAgent(agent);
    return agent;
  }

  async updateAgent(id: string, data: AgentUpdate): Promise<AgentRow> {
    const existing = getStore().agents[id];
    if (!existing) throw new Error(`Agent ${id} not found`);
    const updated: AgentRow = {
      ...existing,
      ...data,
      id: existing.id,
      updated_at: new Date().toISOString(),
    };
    getStore().setAgent(updated);
    return updated;
  }

  async deleteAgent(id: string): Promise<void> {
    getStore().removeAgent(id);
  }
}
