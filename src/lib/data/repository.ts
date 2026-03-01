import type { Database } from "@/types/database";

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

  // Discussions
  createDiscussion(data: DiscussionInsert): Promise<DiscussionRow>;
  getDiscussion(id: string): Promise<DiscussionRow | null>;
  listDiscussions(projectId: string): Promise<DiscussionRow[]>;
  updateDiscussion(id: string, data: DiscussionUpdate): Promise<DiscussionRow>;

  // Messages
  createMessage(data: DiscussionMessageInsert): Promise<DiscussionMessageRow>;
  listMessages(discussionId: string): Promise<DiscussionMessageRow[]>;

  // Proposals
  createProposal(data: ProposalInsert): Promise<ProposalRow>;
  updateProposal(id: string, data: ProposalUpdate): Promise<ProposalRow>;
  listProposals(discussionId: string): Promise<ProposalRow[]>;

  // Memory Index
  createMemoryEntry(data: MemoryIndexInsert): Promise<MemoryIndexRow>;
  queryMemories(projectId: string, keywords: string[], limit: number): Promise<MemoryIndexRow[]>;
  listMemories(projectId: string): Promise<MemoryIndexRow[]>;

  // Apply approved proposals
  createCharacter(data: CharacterInsert): Promise<CharacterRow>;
  createBibleSection(data: BibleSectionInsert): Promise<BibleSectionRow>;
}
