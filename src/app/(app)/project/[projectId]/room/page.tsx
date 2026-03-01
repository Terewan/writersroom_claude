import { MessageSquare } from "lucide-react";

export default function WritersRoomPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <MessageSquare className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">
        Writer&apos;s Room
      </h2>
      <p>Start a discussion to get your agents brainstorming.</p>
    </div>
  );
}
