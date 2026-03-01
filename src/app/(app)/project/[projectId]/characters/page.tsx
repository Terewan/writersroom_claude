import { Users } from "lucide-react";

export default function CharactersPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <Users className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">Characters</h2>
      <p>Character cards and relationship map coming soon.</p>
    </div>
  );
}
