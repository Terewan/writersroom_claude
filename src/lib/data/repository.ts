import type { Database } from "@/types/database";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

export interface DataRepository {
  listProjects(): Promise<ProjectRow[]>;
  getProject(id: string): Promise<ProjectRow | null>;
  createProject(data: ProjectInsert): Promise<ProjectRow>;
  updateProject(id: string, data: ProjectUpdate): Promise<ProjectRow>;
  deleteProject(id: string): Promise<void>;

  listAgents(projectId: string): Promise<AgentRow[]>;
  getAgent(id: string): Promise<AgentRow | null>;
  createAgent(data: AgentInsert): Promise<AgentRow>;
  updateAgent(id: string, data: AgentUpdate): Promise<AgentRow>;
  deleteAgent(id: string): Promise<void>;
}
