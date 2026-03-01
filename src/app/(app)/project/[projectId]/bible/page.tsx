import { BookOpen } from "lucide-react";

export default function ShowBiblePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <BookOpen className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">Show Bible</h2>
      <p>
        Logline, premise, characters, themes, and episode outlines will live
        here.
      </p>
    </div>
  );
}
