// Metered, provider-swappable AI text generator that fronts every creator AI
// tool. Auth = caller JWT (so the quota can't be spoofed via a body userId).
// Deploy PUBLIC: `npx supabase functions deploy ai-generate --no-verify-jwt`.
//
// Body: { tool, campaignId?, inputs? }. Returns { text, remaining, model }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiGenerate, TaskClass } from "../_shared/ai.ts";
import { buildCampaignContext, contextToPrompt } from "../_shared/campaign-context.ts";
import { buildCreatorVoice, voiceToPrompt } from "../_shared/creator-voice.ts";
import { log } from "../_shared/log.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Monthly AI-generation caps by effective plan (mirrors FEATURE_MATRIX
// ai_generations_limit; trial resolves to Pro on both platforms).
const AI_LIMITS: Record<string, number> = { starter: 25, pro: 150, elite: Infinity };

function effectivePlan(profile: any): "starter" | "pro" | "elite" {
  const plan = String(profile?.subscription_plan || "").toLowerCase();
  if (plan === "starter" || plan === "pro" || plan === "elite") return plan;
  const created = profile?.created_at ? new Date(profile.created_at).getTime() : 0;
  const inTrial = created && Date.now() - created < 30 * 24 * 60 * 60 * 1000;
  return inTrial ? "pro" : "starter"; // floor entitlement
}

// Tool registry: taskClass + a system prompt. The user message is assembled
// from campaign context + creator voice + the caller's inputs.
const TOOLS: Record<string, { taskClass: TaskClass; system: string }> = {
  caption: {
    taskClass: "cheap",
    system:
      "You write Instagram captions for a creator. Match the creator's own voice from their past captions. If a campaign is given, weave in the brand naturally, include every REQUIRED HASHTAG and tag every listed handle, and honour the DO/DON'T. Output THREE caption options labelled 1) Personal story 2) Punchy 3) Informative. Append the required + a few niche-relevant hashtags. No preamble.",
  },
  script: {
    taskClass: "standard",
    system:
      "You write short-form video (Reel) scripts for a creator, in their voice. Scope the script to the exact DELIVERABLES. Give 3 hook options, then shot-by-shot beats with on-screen text and spoken lines, folding in the brand's key messages. Keep it tight and shootable. No preamble.",
  },
  hooks: {
    taskClass: "cheap",
    system:
      "You generate 5 scroll-stopping video hooks for a creator in their niche and voice. If a campaign is given, tie each hook to it. Return a numbered list only.",
  },
  pitch: {
    taskClass: "reasoning",
    system:
      "You write a SHORT, personalised application note (max 60 words) from a creator to a brand for a specific campaign. Reference the creator's most relevant real past work and a concrete angle. Confident, specific, no fluff, no emojis-spam. One paragraph. This is the creator's pitch — make it sound human, not AI.",
  },
  rate_card: {
    taskClass: "reasoning",
    system:
      "You recommend content rates (INR) for a creator based on their follower tier and engagement rate, plus any benchmark data provided. Return a compact rate card per deliverable (Reel, Story, YouTube Short, Post, UGC video) as a range, with one line of justification. Be realistic for the Indian micro-creator market. Then end your reply with EXACTLY one line in this machine-readable format (single integers = the midpoint of each range, plain digits, no commas): RATES_JSON: {\"reels\":0,\"stories\":0,\"shorts\":0,\"posts\":0,\"ugc\":0}",
  },
  hashtags: {
    taskClass: "cheap",
    system:
      "You generate Instagram hashtag sets for an Indian creator. Return three short groups with a bold heading each: Niche (10 tags tight to their category), Reach (10 broader discovery tags mixing large + medium size), and — only if campaign context is present — Campaign (required + brand + campaign-fit tags). One line of tags per group, space-separated, all starting with #. No banned or spammy tags, no explanation.",
  },
  match_coach: {
    taskClass: "reasoning",
    system:
      "You are a match-score coach. Given a creator's match breakdown against a brand/campaign, explain in plain language WHY the score is what it is, then give a concrete, prioritised to-do list to raise it (e.g. connect YouTube, add location tags, raise engagement, set a rate card). Be specific and encouraging. Bullet points.",
  },
  media_kit: {
    taskClass: "standard",
    system:
      "You write a creator's media-kit positioning. Produce exactly three sections, each starting with a bold markdown heading on its own line: **Positioning** — a one-line positioning statement; **Bio** — a 2-3 sentence bio in their voice, UNDER 450 characters, ready to paste as their profile bio; **Audience** — a plain-language audience summary from the demographics. If a campaign is given, angle it toward that brand's niche. Nothing before the first heading.",
  },
  compliance: {
    taskClass: "reasoning",
    system:
      "You are a compliance pre-checker for influencer content in India. Given a campaign's requirements and a draft caption, return a checklist with PASS/FAIL for: brand tagged, every required hashtag present, ASCI-compliant paid-partnership disclosure (#ad / #collab / 'paid partnership'), and any DO/DON'T. End with the exact fixes needed. Be strict on disclosure.",
  },
  brief_checklist: {
    taskClass: "standard",
    system:
      "You turn a campaign brief into a tickable deliverable + compliance checklist the creator completes before submitting: deliverables with counts, mandatory mentions/hashtags, ASCI disclosure, dos/donts, and the deadline. Return a clean checklist only.",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const rid = crypto.randomUUID().slice(0, 8);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    // Caller-JWT auth.
    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    const { data: userRes } = await admin.auth.getUser(token);
    const userId = userRes?.user?.id;
    if (!userId) return json({ error: "unauthorized" }, 200);

    const { tool, campaignId, inputs } = (await req.json().catch(() => ({}))) as {
      tool?: string;
      campaignId?: string;
      inputs?: Record<string, unknown>;
    };
    const spec = tool && TOOLS[tool];
    if (!spec) return json({ error: "unknown_tool" });

    // Plan + quota.
    const { data: profile } = await admin
      .from("influencer_profiles")
      .select("subscription_plan, created_at")
      .eq("influencer_id", userId)
      .maybeSingle();
    const plan = effectivePlan(profile);
    const limit = AI_LIMITS[plan] ?? 25;
    const period = new Date().toISOString().slice(0, 7);
    let used = 0;
    if (Number.isFinite(limit)) {
      const { data: rows } = await admin
        .from("ai_generation_usage")
        .select("count")
        .eq("user_id", userId)
        .eq("period", period);
      used = (rows || []).reduce((s: number, r: any) => s + (r.count || 0), 0);
      if (used >= limit) {
        return json({ error: "ai_limit_reached", upgrade: plan === "starter" ? "pro" : "elite", limit, used });
      }
    }

    // Assemble the prompt: campaign context + creator voice + caller inputs.
    const parts: string[] = [];
    if (campaignId) {
      const ctx = await buildCampaignContext(admin, campaignId);
      if (ctx) parts.push(contextToPrompt(ctx));
    }
    const voice = await buildCreatorVoice(admin, userId);
    if (voice) parts.push(voiceToPrompt(voice));

    // `regenerate` / `variation` are control keys — pull them out so they don't
    // leak into the input dump, and use them to force a fresh, different result.
    const { regenerate, variation: _variation, ...userInputs } = (inputs || {}) as Record<string, unknown>;
    if (Object.keys(userInputs).length) {
      parts.push(
        "CREATOR INPUT:\n" +
          Object.entries(userInputs)
            .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
            .join("\n"),
      );
    }
    if (regenerate) {
      parts.push(
        "REGENERATE: Produce a fresh, distinctly DIFFERENT version from any previous attempt shown above — change the angle, the opening line, and the wording. Do not repeat the previous version.",
      );
    }
    const userMsg = parts.join("\n\n") || "Generate for this creator.";

    // There is NO chat interface — the output is rendered as-is. The model must
    // never ask a follow-up question or request more info; it works with the
    // data above and writes a confident version even when some fields are blank.
    const NO_QUESTIONS =
      " Never ask the user for more information and never output a clarifying question — there is no chat, your reply is shown directly. Use the data provided; if a detail is missing, make a reasonable, confident choice or write a strong general version.";

    const result = await aiGenerate(admin, {
      taskClass: spec.taskClass,
      system: spec.system + NO_QUESTIONS,
      messages: [{ role: "user", content: userMsg }],
      maxTokens: tool === "script" || tool === "media_kit" ? 1400 : 900,
      temperature: regenerate ? 0.95 : 0.7,
    });

    // Meter (best-effort — don't fail the response if the counter write hiccups).
    await admin
      .rpc("bump_ai_usage", { p_user: userId, p_period: period, p_tool: tool, p_in: result.usage.input, p_out: result.usage.output })
      .then((r: any) => r?.error && log.warn("ai.usage_bump_failed", { rid, userId }, r.error));

    // Append-only event for the admin AI-usage analytics (provider/model that
    // the quota aggregate above doesn't keep). Best-effort — analytics must
    // never break a generation.
    await admin
      .from("ai_usage_events")
      .insert({
        user_id: userId,
        tool,
        task_class: spec.taskClass,
        provider: result.provider,
        model: result.model,
        tokens_in: result.usage.input,
        tokens_out: result.usage.output,
      })
      .then((r: any) => r?.error && log.warn("ai.usage_event_failed", { rid, userId }, r.error));

    const remaining = Number.isFinite(limit) ? Math.max(0, limit - (used + 1)) : null;
    log.info("ai.generate", { rid, tool, plan, model: result.model, provider: result.provider, tokens: result.usage });
    return json({ text: result.text, remaining, model: result.model });
  } catch (e) {
    const msg = String((e as any)?.message || e);
    log.error("ai.generate_failed", { rid }, e as any);
    // Surface config/key problems to the client cleanly; keep provider errors generic.
    const known = ["ai_disabled", "ai_key_missing", "ai_config_missing"].includes(msg);
    return json({ error: known ? msg : "generation_failed" });
  }
});
