"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Settings,
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings-store";
import { Badge } from "@/components/ui/badge";
import { MODEL_CATALOG, getAllModelOptions, getProviderForModel, type ProviderKey } from "@/lib/ai/provider";

const PROVIDERS = [
  {
    key: "anthropic" as const,
    label: "Anthropic",
    placeholder: "sk-ant-api03-...",
    description: "Claude Opus, Sonnet, and Haiku",
  },
  {
    key: "openai" as const,
    label: "OpenAI",
    placeholder: "sk-proj-...",
    description: "GPT-4o, GPT-4o Mini, o3-mini, o4-mini",
  },
  {
    key: "google" as const,
    label: "Google AI",
    placeholder: "AIza...",
    description: "Gemini 2.5 Pro, Gemini 2.0 Flash",
  },
];

const PROVIDER_LABELS: Record<ProviderKey, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google AI",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  fast: "Quick tasks like summaries and formatting",
  smart: "Core writing and analysis work",
  creative: "Brainstorming and creative generation",
};

export default function SettingsPage() {
  const {
    apiKeys,
    setApiKey,
    modelConfig,
    setModelConfig,
    defaultRoundCount,
    setDefaultRoundCount,
  } = useSettingsStore();

  // Wait for Zustand persist to hydrate from localStorage
  const hydrated = useSyncExternalStore(
    (cb) => useSettingsStore.persist.onFinishHydration(cb),
    () => useSettingsStore.persist.hasHydrated(),
    () => false,
  );

  const modelOptions = getAllModelOptions();

  const groupedModels = (Object.keys(MODEL_CATALOG) as ProviderKey[]).map(
    (provider) => ({
      provider,
      label: PROVIDER_LABELS[provider],
      models: modelOptions.filter((m) => m.provider === provider),
    }),
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber" />
      </div>
    );
  }

  return (
    <div className="grain-overlay relative min-h-screen">
      <div className="pointer-events-none absolute right-0 top-0">
        <div className="h-[400px] w-[400px] rounded-full bg-amber/5 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl p-8 lg:p-12">
        <div className="animate-fade-up opacity-0">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-amber" />
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Settings
            </h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Configure AI models, API keys, and preferences.
          </p>
        </div>

        {/* API Keys */}
        <div className="mt-10 space-y-4 animate-fade-up opacity-0 delay-100">
          <h2 className="font-display text-xl font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Keys are saved in your browser and persist across sessions.
            Each key is verified before saving.
          </p>

          {PROVIDERS.map((provider) => (
            <ApiKeyInput
              key={provider.key}
              provider={provider.key}
              label={provider.label}
              description={provider.description}
              placeholder={provider.placeholder}
              savedValue={apiKeys[provider.key]}
              onSave={(val) => setApiKey(provider.key, val)}
              onClear={() => setApiKey(provider.key, "")}
            />
          ))}
        </div>

        {/* Model Configuration */}
        <div className="mt-10 space-y-4 animate-fade-up opacity-0 delay-200">
          <h2 className="font-display text-xl font-semibold">Model Roles</h2>
          <p className="text-sm text-muted-foreground">
            Choose which AI model powers each type of task.
            The model you pick requires its provider&apos;s API key above.
          </p>

          {(["fast", "smart", "creative"] as const).map((role) => {
            const selectedProvider = getProviderForModel(modelConfig[role]);
            const missingKey = selectedProvider && !apiKeys[selectedProvider];

            return (
              <Card key={role} className="border-border/60 bg-card/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium capitalize">
                        {role}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {ROLE_DESCRIPTIONS[role]}
                      </CardDescription>
                    </div>
                    {selectedProvider && !missingKey && (
                      <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                        {PROVIDER_LABELS[selectedProvider]}
                      </Badge>
                    )}
                    {missingKey && (
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                        {PROVIDER_LABELS[selectedProvider]} key missing
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Select
                    value={modelConfig[role]}
                    onValueChange={(val) => setModelConfig({ [role]: val })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedModels.map((group) => (
                        <SelectGroup key={group.provider}>
                          <SelectLabel>{group.label}</SelectLabel>
                          {group.models.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Preferences */}
        <div className="mt-10 space-y-4 animate-fade-up opacity-0 delay-300">
          <h2 className="font-display text-xl font-semibold">Preferences</h2>

          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Default Discussion Rounds
              </CardTitle>
              <CardDescription className="text-xs">
                How many rounds of agent discussion per session (1&#8211;20)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                min={1}
                max={20}
                value={defaultRoundCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val >= 1 && val <= 20) setDefaultRoundCount(val);
                }}
                className="w-24"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

type VerifyStatus = "idle" | "verifying" | "valid" | "invalid";

function ApiKeyInput({
  provider,
  label,
  description,
  placeholder,
  savedValue,
  onSave,
  onClear,
}: {
  provider: string;
  label: string;
  description: string;
  placeholder: string;
  savedValue: string;
  onSave: (val: string) => void;
  onClear: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [localValue, setLocalValue] = useState(savedValue);
  const [status, setStatus] = useState<VerifyStatus>(
    savedValue ? "valid" : "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  const hasSavedKey = savedValue.length > 0;
  const hasUnsavedChanges = localValue.trim() !== savedValue;
  const maskedKey = savedValue
    ? `${savedValue.slice(0, 7)}${"*".repeat(20)}${savedValue.slice(-4)}`
    : "";

  async function handleVerifyAndSave() {
    const trimmed = localValue.trim();
    if (!trimmed) return;

    setStatus("verifying");
    setErrorMsg("");

    try {
      const res = await fetch("/api/verify-key", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, key: trimmed }),
      });

      const data = await res.json();

      if (data.valid) {
        onSave(trimmed);
        setStatus("valid");
      } else {
        setStatus("invalid");
        setErrorMsg(data.error ?? "Invalid key");
      }
    } catch {
      setStatus("invalid");
      setErrorMsg("Could not reach verification server");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleVerifyAndSave();
    }
  }

  function handleClear() {
    setLocalValue("");
    setStatus("idle");
    setErrorMsg("");
    onClear();
  }

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Label htmlFor={`key-${label}`} className="sr-only">
              {label} API Key
            </Label>
            <Input
              id={`key-${label}`}
              type={visible ? "text" : "password"}
              placeholder={hasSavedKey && !hasUnsavedChanges ? maskedKey : placeholder}
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value);
                if (status === "invalid") setStatus("idle");
              }}
              onKeyDown={handleKeyDown}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setVisible(!visible)}
            >
              {visible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerifyAndSave}
            disabled={!hasUnsavedChanges || !localValue.trim() || status === "verifying"}
            className="shrink-0 gap-1.5"
          >
            {status === "verifying" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {status === "verifying" ? "Verifying" : "Verify & Save"}
          </Button>
          {hasSavedKey && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {status === "invalid" && errorMsg && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            {errorMsg}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: VerifyStatus }) {
  switch (status) {
    case "valid":
      return (
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-500">
          <Check className="h-3 w-3" /> Verified
        </span>
      );
    case "verifying":
      return (
        <span className="flex items-center gap-1 rounded-full bg-amber/10 px-2 py-0.5 text-xs text-amber">
          <Loader2 className="h-3 w-3 animate-spin" /> Checking
        </span>
      );
    case "invalid":
      return (
        <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" /> Invalid
        </span>
      );
    default:
      return null;
  }
}
