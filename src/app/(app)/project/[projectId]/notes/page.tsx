"use client";

import { NotebookPen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemories } from "@/hooks/use-discussions";
import { useProjectContext } from "../layout";
import type { Database } from "@/types/database";

type MemoryRow = Database["public"]["Tables"]["memory_index"]["Row"];

const CATEGORY_COLORS: Record<string, string> = {
  character: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  plot: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  world: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  theme: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  dialogue: "bg-pink-500/15 text-pink-400 border-pink-500/20",
};

function getCategoryStyle(category: string): string {
  const key = Object.keys(CATEGORY_COLORS).find((k) =>
    category.toLowerCase().includes(k),
  );
  return key
    ? CATEGORY_COLORS[key]
    : "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function NoteCard({ memory }: { memory: MemoryRow }) {
  return (
    <div className="group rounded-xl border border-border bg-card/50 p-5 transition-colors hover:border-amber/30">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${getCategoryStyle(memory.category)}`}
        >
          {memory.category}
        </span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber/10 text-[11px] font-bold text-amber">
          {memory.importance}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground">
        {memory.summary}
      </p>

      {memory.keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {memory.keywords.map((kw) => (
            <Badge
              key={kw}
              variant="secondary"
              className="text-[10px] font-normal"
            >
              {kw}
            </Badge>
          ))}
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">
        {formatDate(memory.created_at)}
      </p>
    </div>
  );
}

export default function NotesPage() {
  const { project } = useProjectContext();
  const { data: memories, isLoading } = useMemories(project.id);

  const sorted = memories
    ? [...memories].sort((a, b) => b.importance - a.importance)
    : [];

  return (
    <div className="grain-overlay relative min-h-screen">
      <div className="pointer-events-none absolute right-0 top-0">
        <div className="h-[400px] w-[400px] rounded-full bg-amber/5 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl p-8 lg:p-12">
        {/* Header */}
        <div className="animate-fade-up opacity-0">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">
            Assistant Notes
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight lg:text-5xl">
            {project.title}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Knowledge extracted by the Assistant from Writer&apos;s Room
            discussions.
          </p>
        </div>

        {/* Notes list */}
        <div className="mt-8 animate-fade-up opacity-0 delay-200">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[160px] rounded-xl" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
              <NotebookPen className="h-12 w-12" />
              <h2 className="text-xl font-semibold text-foreground">
                No notes yet
              </h2>
              <p className="max-w-md text-center">
                Start a discussion in the Writer&apos;s Room and the Assistant
                will take notes automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((memory) => (
                <NoteCard key={memory.id} memory={memory} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
