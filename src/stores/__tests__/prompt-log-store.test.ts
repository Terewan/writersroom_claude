import { describe, it, expect, beforeEach } from "vitest";
import { usePromptLogStore } from "../prompt-log-store";
import type { PromptLogEntry } from "../prompt-log-store";

function makeEntry(overrides: Partial<PromptLogEntry> = {}): PromptLogEntry {
  return {
    id: "entry-1",
    callType: "orchestrator",
    label: "Who speaks next?",
    modelAlias: "sonnet",
    promptText: "Pick the next agent…",
    promptTimestamp: 1000,
    responseText: null,
    responseTimestamp: null,
    ...overrides,
  };
}

describe("prompt-log-store", () => {
  beforeEach(() => {
    usePromptLogStore.getState().clearEntries();
  });

  it("starts with an empty entries array", () => {
    expect(usePromptLogStore.getState().entries).toEqual([]);
  });

  it("addEntry appends to the list", () => {
    const entry = makeEntry();
    usePromptLogStore.getState().addEntry(entry);
    expect(usePromptLogStore.getState().entries).toHaveLength(1);
    expect(usePromptLogStore.getState().entries[0]).toEqual(entry);
  });

  it("addEntry preserves existing entries", () => {
    usePromptLogStore.getState().addEntry(makeEntry({ id: "a" }));
    usePromptLogStore.getState().addEntry(makeEntry({ id: "b" }));
    const ids = usePromptLogStore.getState().entries.map((e) => e.id);
    expect(ids).toEqual(["a", "b"]);
  });

  it("finalizeEntry fills in responseText and responseTimestamp", () => {
    usePromptLogStore.getState().addEntry(makeEntry({ id: "x" }));
    usePromptLogStore.getState().finalizeEntry("x", "Agent A should speak", 2000);

    const entry = usePromptLogStore.getState().entries[0];
    expect(entry.responseText).toBe("Agent A should speak");
    expect(entry.responseTimestamp).toBe(2000);
  });

  it("finalizeEntry does not modify other entries", () => {
    usePromptLogStore.getState().addEntry(makeEntry({ id: "a" }));
    usePromptLogStore.getState().addEntry(makeEntry({ id: "b" }));
    usePromptLogStore.getState().finalizeEntry("b", "response", 3000);

    const [a, b] = usePromptLogStore.getState().entries;
    expect(a.responseText).toBeNull();
    expect(b.responseText).toBe("response");
  });

  it("finalizeEntry is a no-op for unknown id", () => {
    usePromptLogStore.getState().addEntry(makeEntry({ id: "known" }));
    usePromptLogStore.getState().finalizeEntry("unknown-id", "data", 4000);

    const entries = usePromptLogStore.getState().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].responseText).toBeNull();
  });

  it("clearEntries resets to empty", () => {
    usePromptLogStore.getState().addEntry(makeEntry({ id: "a" }));
    usePromptLogStore.getState().addEntry(makeEntry({ id: "b" }));
    usePromptLogStore.getState().clearEntries();
    expect(usePromptLogStore.getState().entries).toEqual([]);
  });
});
