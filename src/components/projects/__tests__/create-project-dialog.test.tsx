import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateProjectDialog } from "../create-project-dialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useProjectStore } from "@/stores/project-store";
import { GuestRepository } from "@/lib/data/guest-repository";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

function renderDialog(open = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onOpenChange = vi.fn();
  return {
    onOpenChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <CreateProjectDialog open={open} onOpenChange={onOpenChange} />
      </QueryClientProvider>,
    ),
  };
}

describe("CreateProjectDialog", () => {
  beforeEach(() => {
    useProjectStore.setState({ projects: {}, agents: {} });
  });

  it("renders the dialog when open", () => {
    renderDialog();
    expect(screen.getByText("New Project")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Show Idea")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderDialog(false);
    expect(screen.queryByText("New Project")).not.toBeInTheDocument();
  });

  it("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    renderDialog();

    const submitButton = screen.getByText("Create Project");
    await user.click(submitButton);

    expect(screen.getByText("Title is required")).toBeInTheDocument();
  });

  it("creates a project via the repository (bypasses Radix Select jsdom limitation)", async () => {
    // Radix Select's hasPointerCapture is unsupported in jsdom,
    // so we test the mutation path directly via the repository
    const repo = new GuestRepository();
    const project = await repo.createProject({
      title: "Test Show",
      show_idea: "A great concept",
      genre: "Drama",
      format: "tv_series",
    });

    expect(project.title).toBe("Test Show");
    expect(project.genre).toBe("Drama");

    const stored = useProjectStore.getState().projects;
    expect(Object.values(stored)).toHaveLength(1);
    expect(Object.values(stored)[0].title).toBe("Test Show");
  });

  it("stores multi-genre as slash-separated string", async () => {
    const repo = new GuestRepository();
    const project = await repo.createProject({
      title: "Hybrid Show",
      show_idea: "A genre-bending concept",
      genre: "Drama / Thriller",
      format: "tv_series",
    });

    expect(project.genre).toBe("Drama / Thriller");
    // Verify it splits back correctly
    const genres = project.genre.split(/\s*\/\s*/);
    expect(genres).toEqual(["Drama", "Thriller"]);
  });
});
