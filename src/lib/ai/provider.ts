import { customProvider } from "ai";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

interface ApiKeys {
  anthropic?: string;
  openai?: string;
  google?: string;
}

/** All models the app knows about, grouped by provider. */
export const MODEL_CATALOG = {
  anthropic: [
    { id: "claude-opus-4-6", alias: "opus", label: "Claude Opus 4.6" },
    { id: "claude-sonnet-4-6", alias: "sonnet", label: "Claude Sonnet 4.6" },
    { id: "claude-haiku-4-5-20251001", alias: "haiku", label: "Claude Haiku 4.5" },
  ],
  openai: [
    { id: "gpt-4o", alias: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", alias: "gpt-4o-mini", label: "GPT-4o Mini" },
    { id: "o3-mini", alias: "o3-mini", label: "o3-mini" },
    { id: "o4-mini", alias: "o4-mini", label: "o4-mini" },
  ],
  google: [
    { id: "gemini-2.5-pro", alias: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "gemini-2.0-flash", alias: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  ],
} as const;

export type ProviderKey = keyof typeof MODEL_CATALOG;

/** Flat list of all model aliases for dropdowns */
export function getAllModelOptions() {
  return Object.entries(MODEL_CATALOG).flatMap(([provider, models]) =>
    models.map((m) => ({
      value: m.alias,
      label: m.label,
      provider: provider as ProviderKey,
    })),
  );
}

/** Look up which provider owns a given model alias */
export function getProviderForModel(alias: string): ProviderKey | null {
  for (const [provider, models] of Object.entries(MODEL_CATALOG)) {
    if (models.some((m) => m.alias === alias)) {
      return provider as ProviderKey;
    }
  }
  return null;
}

/** Sensible economical defaults per provider for model roles. */
export const PROVIDER_DEFAULTS: Record<ProviderKey, { fast: string; smart: string; creative: string }> = {
  anthropic: { fast: "haiku", smart: "sonnet", creative: "sonnet" },
  openai: { fast: "gpt-4o-mini", smart: "gpt-4o", creative: "gpt-4o" },
  google: { fast: "gemini-2.0-flash", smart: "gemini-2.0-flash", creative: "gemini-2.5-pro" },
};

export function createWritersRoomProvider(apiKeys: ApiKeys) {
  const languageModels: Record<string, LanguageModelV3> = {};

  if (apiKeys.anthropic) {
    const anthropic = createAnthropic({ apiKey: apiKeys.anthropic });
    for (const m of MODEL_CATALOG.anthropic) {
      languageModels[m.alias] = anthropic(m.id);
    }
  }

  if (apiKeys.openai) {
    const openai = createOpenAI({ apiKey: apiKeys.openai });
    for (const m of MODEL_CATALOG.openai) {
      languageModels[m.alias] = openai(m.id);
    }
  }

  if (apiKeys.google) {
    const google = createGoogleGenerativeAI({ apiKey: apiKeys.google });
    for (const m of MODEL_CATALOG.google) {
      languageModels[m.alias] = google(m.id);
    }
  }

  return customProvider({ languageModels });
}
