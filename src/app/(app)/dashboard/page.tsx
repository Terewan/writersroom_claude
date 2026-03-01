"use client";

import { useState } from "react";
import { Plus, PenTool, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";
import { useProjectStore } from "@/stores/project-store";
import { ProjectCard } from "@/components/projects/project-card";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";

export default function DashboardPage() {
  const { data: projects, isLoading } = useProjects();
  const agents = useProjectStore((s) => s.agents);
  const [dialogOpen, setDialogOpen] = useState(false);

  function agentCountFor(projectId: string): number {
    return Object.values(agents).filter((a) => a.project_id === projectId).length;
  }

  return (
    <div className="grain-overlay relative min-h-screen">
      {/* Background glow */}
      <div className="pointer-events-none absolute right-0 top-0">
        <div className="h-[400px] w-[400px] rounded-full bg-amber/5 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl p-8 lg:p-12">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="animate-fade-up opacity-0">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">
              Dashboard
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight lg:text-5xl">
              Your Projects
            </h1>
            <p className="mt-3 max-w-md text-muted-foreground">
              Every great show starts with a single idea. Open a project or
              create something new.
            </p>
          </div>
          <div className="animate-fade-up opacity-0 delay-200">
            <Button
              onClick={() => setDialogOpen(true)}
              className="h-11 gap-2 bg-amber px-5 font-medium text-background transition-all hover:bg-amber/90 hover:shadow-lg hover:shadow-amber/20"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!projects || projects.length === 0) && (
          <div className="mt-12 animate-fade-up opacity-0 delay-300">
            <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-12 text-center backdrop-blur-sm transition-all hover:border-amber/20 hover:bg-card/80">
              {/* Decorative background pattern */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.015]">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 24px,
                    currentColor 24px,
                    currentColor 25px
                  )`,
                }} />
              </div>

              <div className="relative">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber/20 bg-amber/5 transition-all group-hover:border-amber/40 group-hover:bg-amber/10">
                  <PenTool className="h-7 w-7 text-amber/60 transition-colors group-hover:text-amber" />
                </div>
                <h3 className="font-display text-2xl font-semibold">
                  Your writer&apos;s room awaits
                </h3>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Create your first project to assemble a team of AI writers and
                  start developing your show concept.
                </p>
                <div className="mt-8 flex items-center justify-center gap-3">
                  <Button
                    onClick={() => setDialogOpen(true)}
                    variant="outline"
                    className="h-10 gap-2 border-amber/30 text-amber transition-all hover:border-amber/50 hover:bg-amber/5"
                  >
                    <Sparkles className="h-4 w-4" />
                    Quick Start with AI
                  </Button>
                  <Button variant="ghost" className="h-10 text-muted-foreground">
                    Import existing project
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project grid */}
        {!isLoading && projects && projects.length > 0 && (
          <div className="mt-12 animate-fade-up opacity-0 delay-300">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  agentCount={agentCountFor(project.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Feature hints — only show when empty */}
        {!isLoading && (!projects || projects.length === 0) && (
          <div className="mt-12 grid gap-6 sm:grid-cols-3 animate-fade-up opacity-0 delay-500">
            {[
              {
                title: "AI Writer Agents",
                desc: "Specialized writers with distinct voices debate and develop your ideas",
              },
              {
                title: "Beat Board",
                desc: "Visual character swimlanes to map emotional arcs across your story",
              },
              {
                title: "Show Bible",
                desc: "Auto-generated series bible with version history and export options",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border/40 bg-card/30 p-6 transition-all hover:border-border/80 hover:bg-card/60"
              >
                <h4 className="font-display text-lg font-semibold">
                  {feature.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
