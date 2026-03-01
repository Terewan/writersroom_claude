import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../settings-store";

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      modelConfig: { fast: "haiku", smart: "sonnet", creative: "sonnet" },
      apiKeys: { anthropic: "", openai: "", google: "" },
      defaultRoundCount: 5,
    });
  });

  it("has correct default model config", () => {
    const { modelConfig } = useSettingsStore.getState();
    expect(modelConfig.fast).toBe("haiku");
    expect(modelConfig.smart).toBe("sonnet");
    expect(modelConfig.creative).toBe("sonnet");
  });

  it("updates model config partially", () => {
    useSettingsStore.getState().setModelConfig({ fast: "sonnet" });
    const { modelConfig } = useSettingsStore.getState();
    expect(modelConfig.fast).toBe("sonnet");
    expect(modelConfig.smart).toBe("sonnet");
  });

  it("sets API keys", () => {
    useSettingsStore.getState().setApiKey("anthropic", "sk-test-123");
    expect(useSettingsStore.getState().apiKeys.anthropic).toBe("sk-test-123");
    expect(useSettingsStore.getState().apiKeys.openai).toBe("");
  });

  it("sets default round count", () => {
    useSettingsStore.getState().setDefaultRoundCount(3);
    expect(useSettingsStore.getState().defaultRoundCount).toBe(3);
  });
});
