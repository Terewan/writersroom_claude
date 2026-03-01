"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <p className="mt-2 text-muted-foreground">
        Configure AI models, API keys, and preferences.
      </p>
    </div>
  );
}
