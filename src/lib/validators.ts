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
