import { FileDown } from "lucide-react";

export default function ExportPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <FileDown className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">Export</h2>
      <p>Export your show bible, beat sheet, and character profiles.</p>
    </div>
  );
}
