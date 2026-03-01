import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be under 100 characters"),
  show_idea: z.string().min(1, "Show idea is required").max(2000, "Show idea must be under 2000 characters"),
  genre: z.string().min(1, "Genre is required"),
  format: z.enum(["tv_series", "feature_film", "custom"]),
});

/**
 * Pre-transform version: accepts genre as an array of strings,
 * joins them with " / " for DB storage.
 */
export const createProjectFormSchema = createProjectSchema.extend({
  genre: z
    .array(z.string())
    .min(1, "At least one genre is required")
    .max(3, "Maximum 3 genres")
    .transform((genres) => genres.join(" / ")),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const createAgentSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(50, "Name must be under 50 characters"),
  role: z.string().min(1, "Role is required").max(100),
  expertise: z.string().min(1, "Expertise is required").max(500),
  personality_traits: z.array(z.string()).min(1, "At least one personality trait required").max(5),
  writing_style: z.string().min(1, "Writing style is required").max(200),
  avatar_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color"),
  model_override: z.string().nullable().optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  role: z.string().min(1).max(100).optional(),
  expertise: z.string().min(1).max(500).optional(),
  personality_traits: z.array(z.string()).min(1).max(5).optional(),
  writing_style: z.string().min(1).max(200).optional(),
  avatar_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  model_override: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;

export const suggestAgentsSchema = z.object({
  show_idea: z.string().min(1),
  genre: z.string().min(1),
  format: z.enum(["tv_series", "feature_film", "custom"]),
});

export const suggestedAgentSchema = z.object({
  name: z.string(),
  role: z.string(),
  expertise: z.string(),
  personality_traits: z.array(z.string()),
  writing_style: z.string(),
  avatar_color: z.string(),
});

export const suggestAgentsResponseSchema = z.object({
  agents: z.array(suggestedAgentSchema).min(3).max(6),
});

export type SuggestedAgent = z.infer<typeof suggestedAgentSchema>;
export type SuggestAgentsResponse = z.infer<typeof suggestAgentsResponseSchema>;

// ── Discussion Schemas ──────────────────────────────────────────────────

export const createDiscussionSchema = z.object({
  project_id: z.string().uuid(),
  topic: z.string().min(1).max(500),
  max_rounds: z.number().int().min(1).max(20).optional(),
});

export type CreateDiscussionInput = z.infer<typeof createDiscussionSchema>;

export const userMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export type UserMessageInput = z.infer<typeof userMessageSchema>;

export const updateProposalSchema = z.object({
  status: z.enum(["approved", "rejected", "modified"]),
  user_notes: z.string().max(2000).nullable().optional(),
  proposed_content: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;

export const orchestratorDecisionSchema = z.object({
  next_agent_id: z.string(),
  reasoning: z.string(),
  should_propose: z.boolean(),
  proposal_category: z.enum(["character", "beat", "bible"]).nullable(),
  should_pause: z.boolean().optional(),
});

export type OrchestratorDecision = z.infer<typeof orchestratorDecisionSchema>;

export const memoryExtractionSchema = z.object({
  entries: z.array(
    z.object({
      category: z.string(),
      keywords: z.array(z.string()),
      summary: z.string(),
      importance: z.number().int().min(1).max(10),
    })
  ),
});

export type MemoryExtraction = z.infer<typeof memoryExtractionSchema>;

export const proposalExtractionSchema = z.object({
  proposals: z.array(
    z.object({
      category: z.enum(["character", "beat", "bible"]),
      title: z.string(),
      description: z.string(),
      proposed_content: z.record(z.string(), z.unknown()),
    })
  ),
});

export type ProposalExtraction = z.infer<typeof proposalExtractionSchema>;
