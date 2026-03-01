"use client";

import { useState } from "react";
import { Sparkles, Check, X, Loader2 } from "lucide-react";
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
  const [accepted, setAccepted] = useState<Set<number>>(new Set());

  async function handleSuggest() {
    try {
      const result = await suggestAgents.mutateAsync({
        show_idea: project.show_idea,
        genre: project.genre,
        format: project.format,
      });
      setSuggestions(result.agents);
      setAccepted(new Set());
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
      setAccepted((prev) => new Set(prev).add(index));
    } catch {
      // Handled by mutation state
    }
  }

  async function handleAcceptAll() {
    for (let i = 0; i < suggestions.length; i++) {
      if (!accepted.has(i)) {
        await handleAccept(i);
      }
    }
  }

  function handleDismiss(index: number) {
    setSuggestions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleClose() {
    setSuggestions([]);
    setAccepted(new Set());
  }

  const hasAnyKey = apiKeys.anthropic || apiKeys.openai || apiKeys.google ||
    process.env.NEXT_PUBLIC_HAS_SERVER_KEYS === "true";

  if (suggestions.length > 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold">Suggested Agents</h3>
            <div className="flex gap-2">
              <Button
                onClick={handleAcceptAll}
                disabled={accepted.size === suggestions.length}
                className="gap-2 bg-amber text-background hover:bg-amber/90"
              >
                <Check className="h-4 w-4" />
                Accept All
              </Button>
              <Button variant="ghost" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {suggestions.map((agent, index) => (
              <Card
                key={`${agent.name}-${index}`}
                className={`border-border/60 bg-card/80 transition-all ${
                  accepted.has(index) ? "border-emerald-500/40 opacity-60" : ""
                }`}
              >
                <CardHeader className="flex-row items-start gap-3 space-y-0 pb-2">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: agent.avatar_color }}
                  >
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display text-base font-semibold">{agent.name}</h4>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                  <div className="flex gap-1">
                    {!accepted.has(index) && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-emerald-500 hover:text-emerald-400"
                          onClick={() => handleAccept(index)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDismiss(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {accepted.has(index) && (
                      <Badge className="bg-emerald-500/10 text-emerald-500">Added</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{agent.expertise}</p>
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
        </div>
      </div>
    );
  }

  return (
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
  );
}
