"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/database";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

const FORMAT_LABELS: Record<string, string> = {
  tv_series: "TV Series",
  feature_film: "Feature Film",
  custom: "Custom",
};

interface ProjectCardProps {
  project: ProjectRow;
  agentCount: number;
}

export function ProjectCard({ project, agentCount }: ProjectCardProps) {
  const formattedDate = new Date(project.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/project/${project.id}/room`}>
      <Card className="group relative overflow-hidden border-border/60 bg-card/50 backdrop-blur-sm transition-all hover:border-amber/30 hover:bg-card/80 hover:shadow-lg hover:shadow-amber/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-display text-lg font-semibold leading-tight transition-colors group-hover:text-amber">
              {project.title}
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {project.genre.split(/\s*\/\s*/).map((g) => (
              <Badge key={g} variant="secondary" className="text-[10px]">
                {g}
              </Badge>
            ))}
            <Badge variant="outline" className="text-[10px]">
              {FORMAT_LABELS[project.format] ?? project.format}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {project.show_idea}
          </p>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{formattedDate}</span>
            <span>
              {agentCount} {agentCount === 1 ? "agent" : "agents"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
