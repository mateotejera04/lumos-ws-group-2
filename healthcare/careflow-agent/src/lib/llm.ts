/**
 * Provider-neutral LLM layer.
 *
 * CareFlow talks to any OpenAI-compatible Chat Completions endpoint. Swap the
 * provider by changing env vars only (see .env.example) — no application code
 * changes. To use a totally different SDK (Anthropic, Vertex, Bedrock, ...),
 * reimplement `callLLM` / `callLLMJson` here; the agents don't care how it works.
 *
 * Everything is defensive: if no key is configured, or the call fails, the
 * caller falls back to deterministic mock logic so the demo never breaks.
 */

export interface LlmConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
}

/** Read LLM configuration from the environment (server-side only). */
export function getLlmConfig(): LlmConfig {
  const apiKey = process.env.LLM_API_KEY ?? "";
  const useLlm = (process.env.USE_LLM ?? "false").toLowerCase() === "true";
  return {
    enabled: useLlm && apiKey.length > 0,
    apiKey,
    baseUrl: (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.LLM_MODEL ?? "gpt-4o-mini",
  };
}

/** True when a usable LLM is configured. */
export function isLlmAvailable(): boolean {
  return getLlmConfig().enabled;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Low-level call to an OpenAI-compatible /chat/completions endpoint.
 * Returns the assistant message text, or throws on any error.
 */
export async function callLLM(
  messages: ChatMessage[],
  opts: { temperature?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const cfg = getLlmConfig();
  if (!cfg.enabled) {
    throw new Error("LLM is not configured (set USE_LLM=true and LLM_API_KEY).");
  }

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: opts.temperature ?? 0.2,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("LLM returned an empty response.");
  return text;
}

/**
 * Call the LLM and parse a JSON object from the response. Tolerates models that
 * wrap JSON in prose or code fences.
 */
export async function callLLMJson<T>(
  system: string,
  user: string
): Promise<T> {
  const text = await callLLM(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { jsonMode: true, temperature: 0.1 }
  );
  return extractJson<T>(text);
}

/** Best-effort extraction of a JSON object from an LLM string response. */
export function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Strip code fences / surrounding prose and retry on the first {...} block.
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("Could not parse JSON from LLM response.");
  }
}
