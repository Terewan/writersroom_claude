import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  createProjectFormSchema,
  createAgentSchema,
  updateAgentSchema,
  suggestAgentsSchema,
  suggestAgentsResponseSchema,
} from "../validators";

describe("createProjectSchema", () => {
  it("validates a correct project input", () => {
    const result = createProjectSchema.safeParse({
      title: "Breaking Bad",
      show_idea: "A chemistry teacher turns to cooking meth",
      genre: "Drama",
      format: "tv_series",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createProjectSchema.safeParse({
      title: "",
      show_idea: "Some idea",
      genre: "Drama",
      format: "tv_series",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid format", () => {
    const result = createProjectSchema.safeParse({
      title: "My Show",
      show_idea: "Some idea",
      genre: "Drama",
      format: "podcast",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing genre", () => {
    const result = createProjectSchema.safeParse({
      title: "My Show",
      show_idea: "Some idea",
      genre: "",
      format: "tv_series",
    });
    expect(result.success).toBe(false);
  });
});

describe("createProjectFormSchema", () => {
  it("transforms genre array into joined string", () => {
    const result = createProjectFormSchema.safeParse({
      title: "Hybrid Show",
      show_idea: "A show mixing multiple genres",
      genre: ["Drama", "Thriller"],
      format: "tv_series",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.genre).toBe("Drama / Thriller");
    }
  });

  it("accepts single genre array", () => {
    const result = createProjectFormSchema.safeParse({
      title: "Solo Genre",
      show_idea: "A pure comedy",
      genre: ["Comedy"],
      format: "feature_film",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.genre).toBe("Comedy");
    }
  });

  it("rejects empty genre array", () => {
    const result = createProjectFormSchema.safeParse({
      title: "No Genre",
      show_idea: "Missing genre",
      genre: [],
      format: "tv_series",
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 3 genres", () => {
    const result = createProjectFormSchema.safeParse({
      title: "Too Many",
      show_idea: "Too many genres",
      genre: ["Drama", "Comedy", "Thriller", "Sci-Fi"],
      format: "tv_series",
    });
    expect(result.success).toBe(false);
  });
});

describe("createAgentSchema", () => {
  const validAgent = {
    project_id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Dr. Plot",
    role: "Head Writer",
    expertise: "Plot structure and pacing",
    personality_traits: ["analytical", "creative"],
    writing_style: "Tight, fast-paced prose",
    avatar_color: "#f59e0b",
  };

  it("validates a correct agent input", () => {
    const result = createAgentSchema.safeParse(validAgent);
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID for project_id", () => {
    const result = createAgentSchema.safeParse({
      ...validAgent,
      project_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid hex color", () => {
    const result = createAgentSchema.safeParse({
      ...validAgent,
      avatar_color: "red",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty personality_traits", () => {
    const result = createAgentSchema.safeParse({
      ...validAgent,
      personality_traits: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 5 personality traits", () => {
    const result = createAgentSchema.safeParse({
      ...validAgent,
      personality_traits: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.success).toBe(false);
  });
});

describe("updateAgentSchema", () => {
  it("allows partial updates", () => {
    const result = updateAgentSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("allows empty object", () => {
    const result = updateAgentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid color on update", () => {
    const result = updateAgentSchema.safeParse({ avatar_color: "nope" });
    expect(result.success).toBe(false);
  });
});

describe("suggestAgentsSchema", () => {
  it("validates correct input", () => {
    const result = suggestAgentsSchema.safeParse({
      show_idea: "A show about robots",
      genre: "Sci-Fi",
      format: "tv_series",
    });
    expect(result.success).toBe(true);
  });
});

describe("suggestAgentsResponseSchema", () => {
  it("validates a response with 3+ agents", () => {
    const agents = Array.from({ length: 4 }, (_, i) => ({
      name: `Agent ${i}`,
      role: "Writer",
      expertise: "Writing",
      personality_traits: ["creative"],
      writing_style: "Sharp",
      avatar_color: "#f59e0b",
    }));
    const result = suggestAgentsResponseSchema.safeParse({ agents });
    expect(result.success).toBe(true);
  });

  it("rejects fewer than 3 agents", () => {
    const result = suggestAgentsResponseSchema.safeParse({
      agents: [{ name: "Solo", role: "Writer", expertise: "x", personality_traits: ["a"], writing_style: "b", avatar_color: "#000000" }],
    });
    expect(result.success).toBe(false);
  });
});
