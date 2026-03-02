import { create } from "zustand";

export interface PromptLogEntry {
  id: string;
  callType: "orchestrator" | "proposal" | "agent" | "memory";
  label: string;
  modelAlias: string;
  promptText: string;
  promptTimestamp: number;
  responseText: string | null;
  responseTimestamp: number | null;
}

interface PromptLogState {
  entries: PromptLogEntry[];

  addEntry: (entry: PromptLogEntry) => void;
  finalizeEntry: (
    id: string,
    responseText: string,
    responseTimestamp: number,
  ) => void;
  clearEntries: () => void;
}

export const usePromptLogStore = create<PromptLogState>()((set) => ({
  entries: [],

  addEntry: (entry) =>
    set((state) => ({ entries: [...state.entries, entry] })),

  finalizeEntry: (id, responseText, responseTimestamp) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, responseText, responseTimestamp } : e,
      ),
    })),

  clearEntries: () => set({ entries: [] }),
}));
