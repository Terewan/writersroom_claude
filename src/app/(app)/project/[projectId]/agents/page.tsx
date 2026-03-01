"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentList } from "@/components/agents/agent-list";
import { SuggestAgentsButton } from "@/components/agents/suggest-agents-button";
import { useProjectContext } from "../layout";

export default function AgentsPage() {
  const { project, agents, isLoadingAgents } = useProjectContext();

  return (
    <div className="grain-overlay relative min-h-screen">
      <div className="pointer-events-none absolute right-0 top-0">
        <div className="h-[400px] w-[400px] rounded-full bg-amber/5 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl p-8 lg:p-12">
        {/* Project header */}
        <div className="animate-fade-up opacity-0">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">
            Agents
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight lg:text-5xl">
            {project.title}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            {project.show_idea}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.genre.split(/\s*\/\s*/).map((g) => (
              <Badge key={g} variant="secondary">{g}</Badge>
            ))}
          </div>
        </div>

        {/* Agent actions */}
        <div className="mt-8 flex items-center justify-between animate-fade-up opacity-0 delay-200">
          <h2 className="font-display text-xl font-semibold">
            Writer Agents ({agents.length})
          </h2>
          <SuggestAgentsButton projectId={project.id} />
        </div>

        {/* Agent list */}
        <div className="mt-6 animate-fade-up opacity-0 delay-300">
          {isLoadingAgents ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[200px] rounded-xl" />
              ))}
            </div>
          ) : (
            <AgentList agents={agents} projectId={project.id} />
          )}
        </div>
      </div>
    </div>
  );
}
