import type { Database } from "@/types/database";
import type { DataRepository } from "./repository";
import type { SupabaseClient } from "@supabase/supabase-js";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];
type DiscussionRow = Database["public"]["Tables"]["discussions"]["Row"];
type DiscussionInsert = Database["public"]["Tables"]["discussions"]["Insert"];
type DiscussionUpdate = Database["public"]["Tables"]["discussions"]["Update"];
type DiscussionMessageRow = Database["public"]["Tables"]["discussion_messages"]["Row"];
type DiscussionMessageInsert = Database["public"]["Tables"]["discussion_messages"]["Insert"];
type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];
type ProposalInsert = Database["public"]["Tables"]["proposals"]["Insert"];
type ProposalUpdate = Database["public"]["Tables"]["proposals"]["Update"];
type MemoryIndexRow = Database["public"]["Tables"]["memory_index"]["Row"];
type MemoryIndexInsert = Database["public"]["Tables"]["memory_index"]["Insert"];
type CharacterInsert = Database["public"]["Tables"]["characters"]["Insert"];
type CharacterRow = Database["public"]["Tables"]["characters"]["Row"];
type BibleSectionInsert = Database["public"]["Tables"]["show_bible_sections"]["Insert"];
type BibleSectionRow = Database["public"]["Tables"]["show_bible_sections"]["Row"];

// The client types sometimes resolve to `never` when Database generics
// don't align with the SSR package version. We use an untyped client for
// mutations and cast results — Zod validates all inputs at the boundary.
type UntypedClient = SupabaseClient;

export class SupabaseRepository implements DataRepository {
  private client: UntypedClient;

  constructor(client: UntypedClient) {
    this.client = client;
  }

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
    const { data: { user } } = await this.client.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await this.client
      .from("projects")
      .insert({ ...input, created_by: user.id } as Record<string, unknown>)
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

  // --- Discussions ---

  async createDiscussion(input: DiscussionInsert): Promise<DiscussionRow> {
    const { data, error } = await this.client
      .from("discussions")
      .insert(input as Record<string, unknown>)
      .select()
      .single();
    if (error) throw error;
    return data as DiscussionRow;
  }

  async getDiscussion(id: string): Promise<DiscussionRow | null> {
    const { data, error } = await this.client
      .from("discussions")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return (data as DiscussionRow) ?? null;
  }

  async listDiscussions(projectId: string): Promise<DiscussionRow[]> {
    const { data, error } = await this.client
      .from("discussions")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as DiscussionRow[];
  }

  async updateDiscussion(id: string, input: DiscussionUpdate): Promise<DiscussionRow> {
    const { data, error } = await this.client
      .from("discussions")
      .update({ ...input, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as DiscussionRow;
  }

  // --- Messages ---

  async createMessage(input: DiscussionMessageInsert): Promise<DiscussionMessageRow> {
    const { data, error } = await this.client
      .from("discussion_messages")
      .insert(input as Record<string, unknown>)
      .select()
      .single();
    if (error) throw error;
    return data as DiscussionMessageRow;
  }

  async listMessages(discussionId: string): Promise<DiscussionMessageRow[]> {
    const { data, error } = await this.client
      .from("discussion_messages")
      .select("*")
      .eq("discussion_id", discussionId)
      .order("round_number", { ascending: true })
      .order("turn_order", { ascending: true });
    if (error) throw error;
    return data as DiscussionMessageRow[];
  }

  // --- Proposals ---

  async createProposal(input: ProposalInsert): Promise<ProposalRow> {
    const { data, error } = await this.client
      .from("proposals")
      .insert(input as Record<string, unknown>)
      .select()
      .single();
    if (error) throw error;
    return data as ProposalRow;
  }

  async updateProposal(id: string, input: ProposalUpdate): Promise<ProposalRow> {
    const { data, error } = await this.client
      .from("proposals")
      .update({ ...input, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as ProposalRow;
  }

  async listProposals(discussionId: string): Promise<ProposalRow[]> {
    const { data, error } = await this.client
      .from("proposals")
      .select("*")
      .eq("discussion_id", discussionId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as ProposalRow[];
  }

  // --- Memory Index ---

  async createMemoryEntry(input: MemoryIndexInsert): Promise<MemoryIndexRow> {
    const { data, error } = await this.client
      .from("memory_index")
      .insert(input as Record<string, unknown>)
      .select()
      .single();
    if (error) throw error;
    return data as MemoryIndexRow;
  }

  async queryMemories(projectId: string, keywords: string[], limit: number): Promise<MemoryIndexRow[]> {
    // Use Supabase's overlaps operator for keyword array matching
    let query = this.client
      .from("memory_index")
      .select("*")
      .eq("project_id", projectId)
      .order("importance", { ascending: false })
      .limit(limit);

    if (keywords.length > 0) {
      query = query.overlaps("keywords", keywords);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as MemoryIndexRow[];
  }

  async listMemories(projectId: string): Promise<MemoryIndexRow[]> {
    const { data, error } = await this.client
      .from("memory_index")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as MemoryIndexRow[];
  }

  // --- Apply Proposals ---

  async createCharacter(input: CharacterInsert): Promise<CharacterRow> {
    const { data, error } = await this.client
      .from("characters")
      .insert(input as Record<string, unknown>)
      .select()
      .single();
    if (error) throw error;
    return data as CharacterRow;
  }

  async createBibleSection(input: BibleSectionInsert): Promise<BibleSectionRow> {
    const { data, error } = await this.client
      .from("show_bible_sections")
      .insert(input as Record<string, unknown>)
      .select()
      .single();
    if (error) throw error;
    return data as BibleSectionRow;
  }
}
