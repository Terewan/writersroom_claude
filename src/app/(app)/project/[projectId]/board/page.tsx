import { LayoutGrid } from "lucide-react";

export default function BeatBoardPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <LayoutGrid className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">Beat Board</h2>
      <p>Character swimlanes and act columns will appear here.</p>
    </div>
  );
}
