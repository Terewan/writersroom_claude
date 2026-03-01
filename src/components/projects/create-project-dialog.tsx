"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateProject } from "@/hooks/use-projects";
import { createProjectFormSchema } from "@/lib/validators";
import { Loader2 } from "lucide-react";
import { GenreMultiSelect, type Genre } from "./genre-multi-select";

const FORMATS = [
  { value: "tv_series", label: "TV Series" },
  { value: "feature_film", label: "Feature Film" },
  { value: "custom", label: "Custom" },
] as const;

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const router = useRouter();
  const createProject = useCreateProject();

  const [title, setTitle] = useState("");
  const [showIdea, setShowIdea] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [format, setFormat] = useState<"tv_series" | "feature_film" | "custom">("tv_series");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function resetForm() {
    setTitle("");
    setShowIdea("");
    setGenres([]);
    setFormat("tv_series");
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = createProjectFormSchema.safeParse({
      title,
      show_idea: showIdea,
      genre: genres,
      format,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      const project = await createProject.mutateAsync(result.data);
      resetForm();
      onOpenChange(false);
      router.push(`/project/${project.id}/agents`);
    } catch (err) {
      console.error("[CreateProject] Error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrors({ form: `Failed to create project: ${msg}` });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent
        className="sm:max-w-[520px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">New Project</DialogTitle>
          <DialogDescription>
            Describe your show concept. You can refine it later with your AI writers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="My Amazing Show"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="show_idea">Show Idea</Label>
            <Textarea
              id="show_idea"
              placeholder="A gripping drama about..."
              rows={4}
              value={showIdea}
              onChange={(e) => setShowIdea(e.target.value)}
            />
            {errors.show_idea && <p className="text-xs text-destructive">{errors.show_idea}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Genre (up to 3)</Label>
              <GenreMultiSelect value={genres} onChange={setGenres} />
              {errors.genre && <p className="text-xs text-destructive">{errors.genre}</p>}
            </div>

            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProject.isPending}
              className="gap-2 bg-amber text-background hover:bg-amber/90"
            >
              {createProject.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
