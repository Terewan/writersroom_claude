import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ModelConfig {
  fast: string;
  smart: string;
  creative: string;
}

interface SettingsState {
  modelConfig: ModelConfig;
  setModelConfig: (config: Partial<ModelConfig>) => void;

  apiKeys: {
    anthropic: string;
    openai: string;
    google: string;
  };
  setApiKey: (provider: "anthropic" | "openai" | "google", key: string) => void;

  defaultRoundCount: number;
  setDefaultRoundCount: (count: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      modelConfig: {
        fast: "haiku",
        smart: "sonnet",
        creative: "sonnet",
      },
      setModelConfig: (config) =>
        set((state) => ({
          modelConfig: { ...state.modelConfig, ...config },
        })),

      apiKeys: {
        anthropic: "",
        openai: "",
        google: "",
      },
      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),

      defaultRoundCount: 5,
      setDefaultRoundCount: (count) => set({ defaultRoundCount: count }),
    }),
    {
      name: "writers-room-settings",
    },
  ),
);
