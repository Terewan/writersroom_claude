"use client";

import { useState } from "react";
import { Sparkles, Check, X, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSuggestAgents, useCreateAgent } from "@/hooks/use-agents";
import { useProjectContext } from "@/app/(app)/project/[projectId]/layout";
import { useSettingsStore } from "@/stores/settings-store";
import type { SuggestedAgent } from "@/lib/validators";

interface SuggestAgentsButtonProps {
  projectId: string;
}

export function SuggestAgentsButton({ projectId }: SuggestAgentsButtonProps) {
  const { project } = useProjectContext();
  const suggestAgents = useSuggestAgents(projectId);
  const createAgent = useCreateAgent();
  const apiKeys = useSettingsStore((s) => s.apiKeys);

  const [suggestions, setSuggestions] = useState<SuggestedAgent[]>([]);
  const [acceptedAgents, setAcceptedAgents] = useState<SuggestedAgent[]>([]);

  async function handleSuggest() {
    try {
      const result = await suggestAgents.mutateAsync({
        show_idea: project.show_idea,
        genre: project.genre,
        format: project.format,
      });
      setSuggestions(result.agents);
      setAcceptedAgents([]);
    } catch {
      // Error is shown via mutation state
    }
  }

  async function handleAccept(index: number) {
    const agent = suggestions[index];
    try {
      await createAgent.mutateAsync({
        project_id: projectId,
        name: agent.name,
        role: agent.role,
        expertise: agent.expertise,
        personality_traits: agent.personality_traits,
        writing_style: agent.writing_style,
        avatar_color: agent.avatar_color,
      });
      setAcceptedAgents((prev) => [...prev, agent]);
      setSuggestions((prev) => prev.filter((_, i) => i !== index));
    } catch {
      // Handled by mutation state
    }
  }

  async function handleAcceptAll() {
    for (let i = suggestions.length - 1; i >= 0; i--) {
      await handleAccept(i);
    }
  }

  function handleDismiss(index: number) {
    setSuggestions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleClose() {
    setSuggestions([]);
    setAcceptedAgents([]);
  }

  const hasAnyKey = apiKeys.anthropic || apiKeys.openai || apiKeys.google ||
    process.env.NEXT_PUBLIC_HAS_SERVER_KEYS === "true";

  const isReviewing = suggestions.length > 0 || acceptedAgents.length > 0;

  if (isReviewing) {
    const pendingCount = suggestions.length;
    const allDone = pendingCount === 0;

    return (
      <div className="mt-8 rounded-xl border border-border/60 bg-card/50 p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">AI Suggestions</h3>
            <p className="text-xs text-muted-foreground">
              {allDone
                ? `${acceptedAgents.length} agent${acceptedAgents.length !== 1 ? "s" : ""} added to your team`
                : `${pendingCount} suggestion${pendingCount !== 1 ? "s" : ""} to review`}
            </p>
          </div>
          <div className="flex gap-2">
            {!allDone && (
              <Button
                onClick={handleAcceptAll}
                size="sm"
                className="gap-1.5 bg-amber text-background hover:bg-amber/90"
              >
                <Check className="h-3.5 w-3.5" />
                Accept All
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              {allDone ? "Done" : "Close"}
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Pending suggestions */}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-amber">
              <Sparkles className="h-3.5 w-3.5" />
              Suggestions ({pendingCount})
            </p>
            {pendingCount === 0 ? (
              <div className="rounded-lg border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
                All suggestions reviewed
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((agent, index) => (
                  <Card key={`${agent.name}-${index}`} className="border-border/60">
                    <CardHeader className="flex-row items-start gap-3 space-y-0 p-4 pb-2">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: agent.avatar_color }}
                      >
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold">{agent.name}</h4>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
                          onClick={() => handleAccept(index)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDismiss(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <p className="text-xs text-muted-foreground">{agent.expertise}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {agent.personality_traits.map((trait) => (
                          <Badge key={trait} variant="secondary" className="text-[10px]">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right: Accepted agents */}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-emerald-500">
              <UserCheck className="h-3.5 w-3.5" />
              Accepted ({acceptedAgents.length})
            </p>
            {acceptedAgents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
                Accept suggestions to build your team
              </div>
            ) : (
              <div className="space-y-3">
                {acceptedAgents.map((agent) => (
                  <Card key={agent.name} className="border-emerald-500/20 bg-emerald-500/5">
                    <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: agent.avatar_color }}
                      >
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold">{agent.name}</h4>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                      <Check className="ml-auto h-4 w-4 text-emerald-500" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        onClick={handleSuggest}
        disabled={suggestAgents.isPending || !hasAnyKey}
        className="gap-2 border-amber/30 text-amber hover:border-amber/50 hover:bg-amber/5"
      >
        {suggestAgents.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {suggestAgents.isPending ? "Generating..." : "Suggest Agents"}
      </Button>
      {suggestAgents.isError && (
        <p className="text-xs text-destructive">
          {suggestAgents.error?.message ?? "Failed to generate suggestions"}
        </p>
      )}
    </div>
  );
}
