"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Database } from "@/types/database";

type AgentRow = Database["public"]["Tables"]["agents"]["Row"];

interface AgentCardProps {
  agent: AgentRow;
  onEdit: (agent: AgentRow) => void;
  onDelete: (id: string) => void;
}

export function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:bg-card/80">
      <CardHeader className="flex-row items-start gap-3 space-y-0 pb-3">
        {/* Avatar */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: agent.avatar_color }}
        >
          {agent.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold leading-tight">
            {agent.name}
          </h3>
          <p className="text-xs text-muted-foreground">{agent.role}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(agent)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(agent.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{agent.expertise}</p>

        {agent.personality_traits.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {agent.personality_traits.map((trait) => (
              <Badge key={trait} variant="secondary" className="text-[10px]">
                {trait}
              </Badge>
            ))}
          </div>
        )}

        {agent.writing_style && (
          <p className="mt-3 text-xs italic text-muted-foreground/70">
            Style: {agent.writing_style}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
