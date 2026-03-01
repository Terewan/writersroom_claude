import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "../sidebar";
import { useUIStore } from "@/stores/ui-store";
import { TooltipProvider } from "@/components/ui/tooltip";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

function renderSidebar() {
  return render(
    <TooltipProvider>
      <Sidebar />
    </TooltipProvider>,
  );
}

describe("Sidebar", () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarCollapsed: false });
  });

  it("renders the app name when expanded", () => {
    renderSidebar();
    expect(screen.getByText("Writer's Room")).toBeInTheDocument();
  });

  it("renders dashboard nav link", () => {
    renderSidebar();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders settings nav link", () => {
    renderSidebar();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("collapses when toggle button is clicked", async () => {
    const user = userEvent.setup();
    renderSidebar();

    const collapseButton = screen.getByText("Collapse");
    await user.click(collapseButton);

    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it("hides labels when collapsed", () => {
    useUIStore.setState({ sidebarCollapsed: true });
    renderSidebar();

    expect(screen.queryByText("Writer's Room")).not.toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });
});
