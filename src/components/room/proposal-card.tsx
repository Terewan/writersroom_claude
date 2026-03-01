"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];

interface ProposalCardProps {
  proposal: ProposalRow;
  onDecision: (id: string, status: "approved" | "rejected" | "modified", notes?: string, tags?: string[]) => void;
}

const TAG_OPTIONS = ["character", "beat", "bible"] as const;

const CATEGORY_BORDER: Record<string, string> = {
  character: "border-l-purple-500",
  beat: "border-l-blue-500",
  bible: "border-l-emerald-500",
};

const CATEGORY_BADGE_CLASS: Record<string, string> = {
  character: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  beat: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  bible: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  modified: { label: "Modified", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
};

export function ProposalCard({ proposal, onDecision }: ProposalCardProps) {
  const [showModifyInput, setShowModifyInput] = useState(false);
  const [modifyNotes, setModifyNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const cat = proposal.category;
    return TAG_OPTIONS.includes(cat as typeof TAG_OPTIONS[number]) ? [cat] : [];
  });
  const isDecided = proposal.status !== "pending";

  const handleApprove = useCallback(() => {
    onDecision(proposal.id, "approved");
  }, [onDecision, proposal.id]);

  const handleReject = useCallback(() => {
    onDecision(proposal.id, "rejected");
  }, [onDecision, proposal.id]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        // Don't allow removing the last tag
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== tag);
      }
      return [...prev, tag];
    });
  }, []);

  const handleModifySubmit = useCallback(() => {
    if (modifyNotes.trim() && selectedTags.length > 0) {
      onDecision(proposal.id, "modified", modifyNotes.trim(), selectedTags);
      setShowModifyInput(false);
      setModifyNotes("");
    }
  }, [onDecision, proposal.id, modifyNotes, selectedTags]);

  const borderClass = CATEGORY_BORDER[proposal.category] ?? "border-l-gray-500";
  const badgeClass = CATEGORY_BADGE_CLASS[proposal.category] ?? "";

  return (
    <div className={cn(
      "my-2 rounded-lg border-l-4 bg-card p-4 shadow-sm",
      borderClass,
    )}>
      <div className="mb-2 flex items-center gap-2">
        <Badge variant="outline" className={badgeClass}>
          {proposal.category}
        </Badge>
        {isDecided && STATUS_BADGE[proposal.status] && (
          <Badge variant="outline" className={STATUS_BADGE[proposal.status].className}>
            {STATUS_BADGE[proposal.status].label}
          </Badge>
        )}
      </div>

      <h4 className="text-sm font-bold mb-1">{proposal.title}</h4>
      <p className="text-sm text-muted-foreground mb-3">{proposal.description}</p>

      {!isDecided && (
        <>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950/30"
              onClick={handleApprove}
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950/30"
              onClick={handleReject}
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950/30"
              onClick={() => setShowModifyInput(!showModifyInput)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Modify
            </Button>
          </div>

          {showModifyInput && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground mr-1">Tags:</span>
                {TAG_OPTIONS.map((tag) => {
                  const isActive = selectedTags.includes(tag);
                  const colorClass = CATEGORY_BADGE_CLASS[tag] ?? "";
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-all",
                        isActive
                          ? colorClass
                          : "bg-muted text-muted-foreground opacity-50 hover:opacity-75",
                      )}
                    >
                      {isActive ? `✓ ${tag}` : tag}
                    </button>
                  );
                })}
              </div>
              <Textarea
                placeholder="Describe your modifications..."
                value={modifyNotes}
                onChange={(e) => setModifyNotes(e.target.value)}
                className="min-h-12"
              />
              <Button
                size="sm"
                onClick={handleModifySubmit}
                disabled={!modifyNotes.trim() || selectedTags.length === 0}
              >
                Submit Modification
              </Button>
            </div>
          )}
        </>
      )}

      {isDecided && proposal.user_notes && (
        <p className="mt-2 text-xs text-muted-foreground italic">
          Notes: {proposal.user_notes}
        </p>
      )}
    </div>
  );
}
