import { NextResponse } from "next/server";

interface VerifyRequest {
  provider: "anthropic" | "openai" | "google";
  key: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyRequest;
    const { provider, key } = body;

    if (!provider || !key) {
      return NextResponse.json(
        { valid: false, error: "Provider and key are required" },
        { status: 400 },
      );
    }

    const result = await verifyKey(provider, key);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { valid: false, error: "Verification request failed" },
      { status: 500 },
    );
  }
}

async function verifyKey(
  provider: string,
  key: string,
): Promise<{ valid: boolean; error?: string }> {
  switch (provider) {
    case "anthropic":
      return verifyAnthropic(key);
    case "openai":
      return verifyOpenAI(key);
    case "google":
      return verifyGoogle(key);
    default:
      return { valid: false, error: "Unknown provider" };
  }
}

async function verifyAnthropic(key: string) {
  // Use count_tokens endpoint — free, no generation cost, just checks auth
  const res = await fetch("https://api.anthropic.com/v1/messages/count_tokens", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      messages: [{ role: "user", content: "hi" }],
    }),
  });

  // 401/403 = key is definitely bad
  if (res.status === 401) return { valid: false, error: "Invalid API key" };
  if (res.status === 403) return { valid: false, error: "Key lacks permissions" };

  // Any other response (200, 400, 429, 529, etc.) means auth succeeded —
  // the key is valid even if the specific request had issues
  return { valid: true };
}

async function verifyOpenAI(key: string) {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (res.ok) return { valid: true };
  if (res.status === 401) return { valid: false, error: "Invalid API key" };
  return { valid: false, error: `Authentication failed (${res.status})` };
}

async function verifyGoogle(key: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
  );

  if (res.ok) return { valid: true };
  if (res.status === 400 || res.status === 403)
    return { valid: false, error: "Invalid API key" };
  return { valid: false, error: `Authentication failed (${res.status})` };
}
