import type { Database } from "@/types/database";
import type { DataRepository } from "./repository";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

// The client types sometimes resolve to `never` when Database generics
// don't align with the SSR package version. We use an untyped client for
// mutations and cast results — Zod validates all inputs at the boundary.
type UntypedClient = SupabaseClient;

export class SupabaseRepository implements DataRepository {
  private client: UntypedClient = createClient();

  async listProjects(): Promise<ProjectRow[]> {
    const { data, error } = await this.client
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as ProjectRow[];
  }

  async getProject(id: string): Promise<ProjectRow | null> {
    const { data, error } = await this.client
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return (data as ProjectRow) ?? null;
  }

  async createProject(input: ProjectInsert): Promise<ProjectRow> {
    const { data, error } = await this.client
      .from("projects")
      .insert(input as Record<string, unknown>)
      .select()
      .single();
    if (error) throw error;
    return data as ProjectRow;
  }

  async updateProject(id: string, input: ProjectUpdate): Promise<ProjectRow> {
    const { data, error } = await this.client
      .from("projects")
      .update({ ...input, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as ProjectRow;
  }

  async deleteProject(id: string): Promise<void> {
    const { error } = await this.client
      .from("projects")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  async listAgents(projectId: string): Promise<AgentRow[]> {
    const { data, error } = await this.client
      .from("agents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as AgentRow[];
  }

  async getAgent(id: string): Promise<AgentRow | null> {
    const { data, error } = await this.client
      .from("agents")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return (data as AgentRow) ?? null;
  }

  async createAgent(input: AgentInsert): Promise<AgentRow> {
    const { data, error } = await this.client
      .from("agents")
      .insert(input as Record<string, unknown>)
      .select()
      .single();
    if (error) throw error;
    return data as AgentRow;
  }

  async updateAgent(id: string, input: AgentUpdate): Promise<AgentRow> {
    const { data, error } = await this.client
      .from("agents")
      .update({ ...input, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as AgentRow;
  }

  async deleteAgent(id: string): Promise<void> {
    const { error } = await this.client
      .from("agents")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}
