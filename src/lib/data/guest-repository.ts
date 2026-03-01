import type { Database } from "@/types/database";
import type { DataRepository } from "./repository";
import { useProjectStore } from "@/stores/project-store";
import { useDiscussionStore } from "@/stores/discussion-store";

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

function getStore() {
  return useProjectStore.getState();
}

function getDiscStore() {
  return useDiscussionStore.getState();
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

  // --- Discussions ---

  async createDiscussion(data: DiscussionInsert): Promise<DiscussionRow> {
    const now = new Date().toISOString();
    const discussion: DiscussionRow = {
      id: data.id ?? crypto.randomUUID(),
      project_id: data.project_id,
      topic: data.topic,
      max_rounds: data.max_rounds ?? 5,
      current_round: data.current_round ?? 0,
      status: data.status ?? "pending",
      summary: data.summary ?? null,
      created_at: now,
      updated_at: now,
    };
    getDiscStore().setDiscussion(discussion);
    return discussion;
  }

  async getDiscussion(id: string): Promise<DiscussionRow | null> {
    return getDiscStore().discussions[id] ?? null;
  }

  async listDiscussions(projectId: string): Promise<DiscussionRow[]> {
    return Object.values(getDiscStore().discussions)
      .filter((d) => d.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async updateDiscussion(id: string, data: DiscussionUpdate): Promise<DiscussionRow> {
    const existing = getDiscStore().discussions[id];
    if (!existing) throw new Error(`Discussion ${id} not found`);
    const updated: DiscussionRow = {
      ...existing,
      ...data,
      id: existing.id,
      updated_at: new Date().toISOString(),
    };
    getDiscStore().setDiscussion(updated);
    return updated;
  }

  // --- Messages ---

  async createMessage(data: DiscussionMessageInsert): Promise<DiscussionMessageRow> {
    const message: DiscussionMessageRow = {
      id: data.id ?? crypto.randomUUID(),
      discussion_id: data.discussion_id,
      agent_id: data.agent_id ?? null,
      round_number: data.round_number,
      turn_order: data.turn_order,
      role: data.role,
      content: data.content,
      metadata: data.metadata ?? {},
      created_at: new Date().toISOString(),
    };
    getDiscStore().setMessage(message);
    return message;
  }

  async listMessages(discussionId: string): Promise<DiscussionMessageRow[]> {
    return Object.values(getDiscStore().messages)
      .filter((m) => m.discussion_id === discussionId)
      .sort((a, b) => {
        const roundDiff = a.round_number - b.round_number;
        if (roundDiff !== 0) return roundDiff;
        return a.turn_order - b.turn_order;
      });
  }

  // --- Proposals ---

  async createProposal(data: ProposalInsert): Promise<ProposalRow> {
    const now = new Date().toISOString();
    const proposal: ProposalRow = {
      id: data.id ?? crypto.randomUUID(),
      discussion_id: data.discussion_id,
      category: data.category,
      title: data.title,
      description: data.description,
      proposed_content: data.proposed_content ?? {},
      status: data.status ?? "pending",
      user_notes: data.user_notes ?? null,
      created_at: now,
      updated_at: now,
    };
    getDiscStore().setProposal(proposal);
    return proposal;
  }

  async updateProposal(id: string, data: ProposalUpdate): Promise<ProposalRow> {
    const existing = getDiscStore().proposals[id];
    if (!existing) throw new Error(`Proposal ${id} not found`);
    const updated: ProposalRow = {
      ...existing,
      ...data,
      id: existing.id,
      updated_at: new Date().toISOString(),
    };
    getDiscStore().setProposal(updated);
    return updated;
  }

  async listProposals(discussionId: string): Promise<ProposalRow[]> {
    return Object.values(getDiscStore().proposals)
      .filter((p) => p.discussion_id === discussionId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // --- Memory Index ---

  async createMemoryEntry(data: MemoryIndexInsert): Promise<MemoryIndexRow> {
    const now = new Date().toISOString();
    const entry: MemoryIndexRow = {
      id: data.id ?? crypto.randomUUID(),
      project_id: data.project_id,
      category: data.category,
      keywords: data.keywords ?? [],
      summary: data.summary,
      source_discussion_id: data.source_discussion_id ?? null,
      source_round: data.source_round ?? null,
      importance: data.importance ?? 5,
      created_at: now,
      updated_at: now,
    };
    getDiscStore().setMemoryEntry(entry);
    return entry;
  }

  async queryMemories(projectId: string, keywords: string[], limit: number): Promise<MemoryIndexRow[]> {
    const allEntries = Object.values(getDiscStore().memoryEntries)
      .filter((m) => m.project_id === projectId);

    if (keywords.length === 0) {
      return allEntries
        .sort((a, b) => b.importance - a.importance)
        .slice(0, limit);
    }

    const lowerKeywords = keywords.map((k) => k.toLowerCase());

    // Score by keyword overlap + importance weighting
    // Only include entries that have at least one keyword match
    const scored = allEntries.map((entry) => {
      const entryKeywords = entry.keywords.map((k) => k.toLowerCase());
      const overlap = lowerKeywords.filter((k) =>
        entryKeywords.some((ek) => ek.includes(k) || k.includes(ek)),
      ).length;
      const score = overlap * 10 + entry.importance;
      return { entry, score, overlap };
    });

    return scored
      .filter((s) => s.overlap > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.entry);
  }

  async listMemories(projectId: string): Promise<MemoryIndexRow[]> {
    return Object.values(getDiscStore().memoryEntries)
      .filter((m) => m.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // --- Apply Proposals ---

  async createCharacter(data: CharacterInsert): Promise<CharacterRow> {
    const now = new Date().toISOString();
    const character: CharacterRow = {
      id: data.id ?? crypto.randomUUID(),
      project_id: data.project_id,
      name: data.name,
      role: data.role ?? "",
      color_hex: data.color_hex ?? "#6366f1",
      bio: data.bio ?? {},
      motivations: data.motivations ?? "",
      flaws: data.flaws ?? "",
      arc: data.arc ?? "",
      position_index: data.position_index ?? 0,
      created_at: now,
      updated_at: now,
    };
    // Characters are project-level, stored outside discussion store
    return character;
  }

  async createBibleSection(data: BibleSectionInsert): Promise<BibleSectionRow> {
    const now = new Date().toISOString();
    const section: BibleSectionRow = {
      id: data.id ?? crypto.randomUUID(),
      project_id: data.project_id,
      section_type: data.section_type,
      title: data.title,
      content: data.content ?? {},
      sort_order: data.sort_order ?? 0,
      created_at: now,
      updated_at: now,
    };
    return section;
  }
}
