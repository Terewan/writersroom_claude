"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AgentCard } from "./agent-card";
import { AgentEditDialog } from "./agent-edit-dialog";
import { useDeleteAgent } from "@/hooks/use-agents";
import type { Database } from "@/types/database";

type AgentRow = Database["public"]["Tables"]["agents"]["Row"];

interface AgentListProps {
  agents: AgentRow[];
  projectId: string;
}

export function AgentList({ agents, projectId }: AgentListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentRow | null>(null);
  const deleteAgent = useDeleteAgent(projectId);

  function handleEdit(agent: AgentRow) {
    setEditingAgent(agent);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingAgent(null);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deleteAgent.mutateAsync(id);
    } catch {
      // Silently handled — query will re-fetch
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

        {/* Add Agent card */}
        <button onClick={handleAdd} className="text-left">
          <Card className="flex h-full min-h-[160px] cursor-pointer items-center justify-center border-dashed border-border/60 bg-card/30 transition-all hover:border-amber/30 hover:bg-card/50">
            <CardContent className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Add Agent</span>
            </CardContent>
          </Card>
        </button>
      </div>

      <AgentEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        agent={editingAgent}
      />
    </>
  );
}
