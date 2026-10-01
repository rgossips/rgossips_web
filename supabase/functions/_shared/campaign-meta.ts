// The campaign metadata trailer.
//
// Campaigns pack their extra fields into the tail of `description` as JSON,
// after a "\n\n---\n" separator, rather than growing a column per field:
//
//   Real prose the creator reads.
//
//   ---
//   {"banner_image":"…","shipping_required":"yes","shipping_timeline_days":4}
//
// Some very old rows are the JSON object alone with no prose in front, so
// both shapes are handled. A trailer that fails to parse is treated as
// absent — never as an error — because the prose half is still valid and the
// creator-facing flows must not break over a malformed tail.
//
// Parsed in a dozen places across three repos; this is the edge-function
// copy. The admin portal's equivalents live in its campaign pages, and
// `shipping_required` in particular is mirrored by
// src/lib/barter-fulfilment.ts there.

const SEPARATOR = "\n\n---\n";

export type ShippingMode = "no" | "yes" | "pickup";

// deno-lint-ignore no-explicit-any
export function parseCampaignMeta(description: string | null | undefined): Record<string, any> {
  const text = String(description || "");
  const at = text.indexOf(SEPARATOR);
  const json = at !== -1 ? text.slice(at + SEPARATOR.length) : text.trimStart().startsWith("{") ? text : "";
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// The prose half, with the trailer removed — what a creator should actually
// be shown.
export function campaignProse(description: string | null | undefined): string {
  const text = String(description || "");
  const at = text.indexOf(SEPARATOR);
  if (at !== -1) return text.slice(0, at);
  return text.trimStart().startsWith("{") ? "" : text;
}

// "yes" = we post it to the creator, so we need their address.
// "pickup" = the creator collects it, so the BRAND supplies an address.
// "no" = nothing physical moves.
export function shippingMode(description: string | null | undefined): ShippingMode {
  const value = parseCampaignMeta(description).shipping_required;
  return value === "yes" || value === "pickup" ? value : "no";
}

// How long after dispatch the product should arrive. Null when the campaign
// never said, so the caller can pick its own default.
export function shippingTimelineDays(description: string | null | undefined): number | null {
  const raw = Number(parseCampaignMeta(description).shipping_timeline_days);
  return Number.isFinite(raw) && raw > 0 ? raw : null;
}
