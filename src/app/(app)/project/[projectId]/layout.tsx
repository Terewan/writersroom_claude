"use client";

import { createContext, use, useContext, type ReactNode } from "react";
import { useProject } from "@/hooks/use-projects";
import { useAgents } from "@/hooks/use-agents";
import type { Database } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];

interface ProjectContextValue {
  project: ProjectRow;
  agents: AgentRow[];
  isLoadingAgents: boolean;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProjectContext(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within ProjectLayout");
  return ctx;
}

export default function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { data: project, isLoading: isLoadingProject } = useProject(projectId);
  const { data: agents, isLoading: isLoadingAgents } = useAgents(projectId);

  if (isLoadingProject) {
    return (
      <div className="p-8">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <ProjectContext.Provider
      value={{
        project,
        agents: agents ?? [],
        isLoadingAgents,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
