import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentCard } from "../agent-card";
import type { Database } from "@/types/database";

type AgentRow = Database["public"]["Tables"]["agents"]["Row"];

const mockAgent: AgentRow = {
  id: "agent-1",
  project_id: "proj-1",
  name: "Dr. Plot",
  role: "Head Writer",
  expertise: "Plot structure and dramatic tension",
  personality_traits: ["analytical", "bold", "witty"],
  writing_style: "Tight, fast-paced prose with sharp twists",
  avatar_color: "#f59e0b",
  model_override: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("AgentCard", () => {
  it("renders agent name and role", () => {
    render(
      <AgentCard agent={mockAgent} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("Dr. Plot")).toBeInTheDocument();
    expect(screen.getByText("Head Writer")).toBeInTheDocument();
  });

  it("renders expertise", () => {
    render(
      <AgentCard agent={mockAgent} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("Plot structure and dramatic tension")).toBeInTheDocument();
  });

  it("renders personality traits as badges", () => {
    render(
      <AgentCard agent={mockAgent} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("analytical")).toBeInTheDocument();
    expect(screen.getByText("bold")).toBeInTheDocument();
    expect(screen.getByText("witty")).toBeInTheDocument();
  });

  it("renders writing style", () => {
    render(
      <AgentCard agent={mockAgent} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText(/Tight, fast-paced prose/)).toBeInTheDocument();
  });

  it("renders avatar with correct initial and color", () => {
    render(
      <AgentCard agent={mockAgent} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    const avatar = screen.getByText("D");
    expect(avatar).toBeInTheDocument();
    // Inline style attribute in jsdom — check via getAttribute
    const style = avatar.closest("[style]")?.getAttribute("style") ?? "";
    expect(style).toContain("background-color");
  });

  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <AgentCard agent={mockAgent} onEdit={onEdit} onDelete={vi.fn()} />,
    );

    // Buttons are hidden by default, visible on hover — but still in DOM
    const buttons = screen.getAllByRole("button");
    // First button is edit
    await user.click(buttons[0]);
    expect(onEdit).toHaveBeenCalledWith(mockAgent);
  });

  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <AgentCard agent={mockAgent} onEdit={vi.fn()} onDelete={onDelete} />,
    );

    const buttons = screen.getAllByRole("button");
    // Second button is delete
    await user.click(buttons[1]);
    expect(onDelete).toHaveBeenCalledWith("agent-1");
  });
});
