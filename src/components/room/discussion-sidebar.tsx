"use client";

import type { Database } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type DiscussionRow = Database["public"]["Tables"]["discussions"]["Row"];

interface DiscussionSidebarProps {
  discussions: DiscussionRow[];
  activeDiscussionId: string | null;
  onSelectDiscussion: (id: string) => void;
  onNewDiscussion: () => void;
}

function formatRelativeDate(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function StatusBadge({ status }: { status: DiscussionRow["status"] }) {
  switch (status) {
    case "running":
      return (
        <Badge variant="default" className="gap-1 bg-green-600 text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          Running
        </Badge>
      );
    case "paused":
      return (
        <Badge variant="outline" className="text-amber-700 border-amber-400 dark:text-amber-400 dark:border-amber-600">
          Paused
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="secondary" className="text-blue-700 dark:text-blue-400">
          Completed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          Pending
        </Badge>
      );
  }
}

export function DiscussionSidebar({
  discussions,
  activeDiscussionId,
  onSelectDiscussion,
  onNewDiscussion,
}: DiscussionSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r">
      <div className="p-3">
        <Button
          onClick={onNewDiscussion}
          variant="outline"
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Discussion
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2 pb-2">
          {discussions.map((discussion) => (
            <button
              key={discussion.id}
              onClick={() => onSelectDiscussion(discussion.id)}
              className={cn(
                "flex w-full flex-col gap-1.5 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent",
                activeDiscussionId === discussion.id && "bg-accent",
              )}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium line-clamp-1">
                  {discussion.topic}
                </span>
              </div>
              <div className="flex items-center justify-between pl-5.5">
                <StatusBadge status={discussion.status} />
                <span className="text-xs text-muted-foreground">
                  {formatRelativeDate(discussion.created_at)}
                </span>
              </div>
            </button>
          ))}

          {discussions.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No discussions yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
