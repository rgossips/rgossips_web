// Provider-swappable AI adapter. Reads the admin-editable `ai_config` row for
// the active provider, the model per task class, and the API key (DB key first,
// Deno env secret as fallback), then calls the right REST API and normalises
// the response. Swapping provider/model or rotating a key is a one-row admin
// edit — no code change or redeploy. See migration 049_ai_config.sql.

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type TaskClass = "cheap" | "standard" | "reasoning" | "multimodal";
export type Provider = "anthropic" | "openai" | "gemini";

export interface GenerateOpts {
  taskClass: TaskClass;
  system?: string;
  // Plain text turns. (Multimodal image/video blocks come in a later tier.)
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateResult {
  text: string;
  provider: Provider;
  model: string;
  usage: { input: number; output: number };
}

// 30s in-process cache so a burst of generations doesn't re-read ai_config each
// time. Provider/key changes take effect within 30s.
let cache: { cfg: Record<string, any> | null; at: number } | null = null;

async function loadConfig(admin: SupabaseClient): Promise<Record<string, any>> {
  if (cache && Date.now() - cache.at < 30_000 && cache.cfg) return cache.cfg;
  const { data } = await admin.from("ai_config").select("*").eq("id", 1).maybeSingle();
  cache = { cfg: data, at: Date.now() };
  if (!data) throw new Error("ai_config_missing");
  return data;
}

function keyFor(provider: Provider, cfg: Record<string, any>): string | null {
  if (provider === "anthropic") return cfg.anthropic_api_key || Deno.env.get("ANTHROPIC_API_KEY") || null;
  if (provider === "openai") return cfg.openai_api_key || Deno.env.get("OPENAI_API_KEY") || null;
  return cfg.gemini_api_key || Deno.env.get("GEMINI_API_KEY") || null;
}

export async function aiGenerate(admin: SupabaseClient, opts: GenerateOpts): Promise<GenerateResult> {
  const cfg = await loadConfig(admin);
  if (cfg.enabled === false) throw new Error("ai_disabled");
  const provider = String(cfg.active_provider || "anthropic") as Provider;
  const model = String(cfg[`model_${opts.taskClass}`] || cfg.model_standard);
  const key = keyFor(provider, cfg);
  if (!key) throw new Error("ai_key_missing");
  const maxTokens = opts.maxTokens ?? 1024;
  const temperature = opts.temperature ?? 0.7;

  if (provider === "anthropic") return anthropic(key, model, opts, maxTokens, temperature);
  if (provider === "openai") return openai(key, model, opts, maxTokens, temperature);
  return gemini(key, model, opts, maxTokens, temperature);
}

async function anthropic(key: string, model: string, o: GenerateOpts, maxTokens: number, temperature: number): Promise<GenerateResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      ...(o.system ? { system: o.system } : {}),
      messages: o.messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`anthropic_${res.status}: ${data?.error?.message || res.statusText}`);
  const text = (data?.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
  return { text, provider: "anthropic", model, usage: { input: data?.usage?.input_tokens || 0, output: data?.usage?.output_tokens || 0 } };
}

async function openai(key: string, model: string, o: GenerateOpts, maxTokens: number, temperature: number): Promise<GenerateResult> {
  const messages = [
    ...(o.system ? [{ role: "system", content: o.system }] : []),
    ...o.messages.map((m) => ({ role: m.role, content: m.content })),
  ];
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`openai_${res.status}: ${data?.error?.message || res.statusText}`);
  const text = String(data?.choices?.[0]?.message?.content || "").trim();
  return { text, provider: "openai", model, usage: { input: data?.usage?.prompt_tokens || 0, output: data?.usage?.completion_tokens || 0 } };
}

async function gemini(key: string, model: string, o: GenerateOpts, maxTokens: number, temperature: number): Promise<GenerateResult> {
  const contents = o.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents,
        ...(o.system ? { systemInstruction: { parts: [{ text: o.system }] } } : {}),
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`gemini_${res.status}: ${data?.error?.message || res.statusText}`);
  const text = (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("").trim();
  const u = data?.usageMetadata || {};
  return { text, provider: "gemini", model, usage: { input: u?.promptTokenCount || 0, output: u?.candidatesTokenCount || 0 } };
}
