"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAgentSchema, updateAgentSchema } from "@/lib/validators";
import { useCreateAgent, useUpdateAgent } from "@/hooks/use-agents";
import { Loader2, X } from "lucide-react";
import type { Database } from "@/types/database";
import { cn } from "@/lib/utils";

type AgentRow = Database["public"]["Tables"]["agents"]["Row"];

const COLOR_SWATCHES = [
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#10b981", // emerald
  "#ec4899", // pink
  "#f97316", // orange
  "#06b6d4", // cyan
];

interface AgentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  agent?: AgentRow | null;
}

export function AgentEditDialog({
  open,
  onOpenChange,
  projectId,
  agent,
}: AgentEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {agent ? "Edit Agent" : "Add Agent"}
          </DialogTitle>
          <DialogDescription>
            {agent
              ? "Update this writer agent's configuration."
              : "Create a new AI writer for your project."}
          </DialogDescription>
        </DialogHeader>
        {/* Key forces remount with fresh state when agent changes */}
        <AgentForm
          key={agent?.id ?? "new"}
          projectId={projectId}
          agent={agent ?? null}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AgentForm({
  projectId,
  agent,
  onClose,
}: {
  projectId: string;
  agent: AgentRow | null;
  onClose: () => void;
}) {
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent(projectId);
  const isEditing = Boolean(agent);

  const [name, setName] = useState(agent?.name ?? "");
  const [role, setRole] = useState(agent?.role ?? "");
  const [expertise, setExpertise] = useState(agent?.expertise ?? "");
  const [traitsInput, setTraitsInput] = useState("");
  const [traits, setTraits] = useState<string[]>(agent?.personality_traits ?? []);
  const [writingStyle, setWritingStyle] = useState(agent?.writing_style ?? "");
  const [avatarColor, setAvatarColor] = useState(agent?.avatar_color ?? COLOR_SWATCHES[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function addTrait() {
    const trimmed = traitsInput.trim();
    if (trimmed && traits.length < 5 && !traits.includes(trimmed)) {
      setTraits([...traits, trimmed]);
      setTraitsInput("");
    }
  }

  function removeTrait(trait: string) {
    setTraits(traits.filter((t) => t !== trait));
  }

  function handleTraitKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTrait();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const data = {
      name,
      role,
      expertise,
      personality_traits: traits,
      writing_style: writingStyle,
      avatar_color: avatarColor,
    };

    if (isEditing && agent) {
      const result = updateAgentSchema.safeParse(data);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0];
          if (typeof field === "string") fieldErrors[field] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }

      try {
        await updateAgent.mutateAsync({ id: agent.id, data: result.data });
        onClose();
      } catch {
        setErrors({ form: "Failed to update agent." });
      }
    } else {
      const result = createAgentSchema.safeParse({ ...data, project_id: projectId });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0];
          if (typeof field === "string") fieldErrors[field] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }

      try {
        await createAgent.mutateAsync(result.data);
        onClose();
      } catch {
        setErrors({ form: "Failed to create agent." });
      }
    }
  }

  const isPending = createAgent.isPending || updateAgent.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agent-name">Name</Label>
          <Input
            id="agent-name"
            placeholder="Dr. Storyline"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent-role">Role</Label>
          <Input
            id="agent-role"
            placeholder="Head Writer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-expertise">Expertise</Label>
        <Textarea
          id="agent-expertise"
          placeholder="Character development, dialogue, plot structure..."
          rows={2}
          value={expertise}
          onChange={(e) => setExpertise(e.target.value)}
        />
        {errors.expertise && <p className="text-xs text-destructive">{errors.expertise}</p>}
      </div>

      <div className="space-y-2">
        <Label>Personality Traits ({traits.length}/5)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add trait..."
            value={traitsInput}
            onChange={(e) => setTraitsInput(e.target.value)}
            onKeyDown={handleTraitKeyDown}
            disabled={traits.length >= 5}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTrait}
            disabled={traits.length >= 5 || !traitsInput.trim()}
          >
            Add
          </Button>
        </div>
        {traits.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {traits.map((trait) => (
              <span
                key={trait}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs"
              >
                {trait}
                <button type="button" onClick={() => removeTrait(trait)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {errors.personality_traits && (
          <p className="text-xs text-destructive">{errors.personality_traits}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-style">Writing Style</Label>
        <Input
          id="agent-style"
          placeholder="Sharp dialogue, vivid descriptions..."
          value={writingStyle}
          onChange={(e) => setWritingStyle(e.target.value)}
        />
        {errors.writing_style && (
          <p className="text-xs text-destructive">{errors.writing_style}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Avatar Color</Label>
        <div className="flex gap-2">
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-all",
                avatarColor === color
                  ? "border-foreground scale-110"
                  : "border-transparent hover:scale-105",
              )}
              style={{ backgroundColor: color }}
              onClick={() => setAvatarColor(color)}
            />
          ))}
        </div>
      </div>

      {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="gap-2 bg-amber text-background hover:bg-amber/90"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Add Agent"}
        </Button>
      </DialogFooter>
    </form>
  );
}
