// Branch-per-platform push senders shared by send-push.
//   - Web Push (browsers): VAPID via npm:web-push.
//   - FCM (Android + iOS): Firebase HTTP v1, service-account JWT → OAuth token.
//
// All credentials come from Supabase function secrets:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:…)
//   FCM_SERVICE_ACCOUNT  (the full service-account JSON, single line)
//
// Each sender returns { ok, gone?, error? }. `gone` = the device is dead
// (expired/unsubscribed) and the caller should delete its row.

import webpush from "npm:web-push@3.6.7";

export interface PushPayload {
  title: string;
  body: string;
  link?: string;
  type?: string;
}
export interface SendResult {
  ok: boolean;
  gone?: boolean;
  error?: string;
}

// ── Web Push (VAPID) ─────────────────────────────────────────────────
let vapidReady: boolean | null = null;
function ensureVapid(): boolean {
  if (vapidReady !== null) return vapidReady;
  const pub = Deno.env.get("VAPID_PUBLIC_KEY");
  const priv = Deno.env.get("VAPID_PRIVATE_KEY");
  const subject = Deno.env.get("VAPID_SUBJECT") || "mailto:support@rgossips.com";
  if (!pub || !priv) {
    vapidReady = false;
    return false;
  }
  webpush.setVapidDetails(subject, pub, priv);
  vapidReady = true;
  return true;
}

export async function sendWebPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
): Promise<SendResult> {
  if (!ensureVapid()) return { ok: false, error: "vapid_missing" };
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    );
    return { ok: true };
  } catch (e) {
    const status = (e as any)?.statusCode;
    return {
      ok: false,
      gone: status === 404 || status === 410,
      error: String((e as any)?.body || (e as any)?.message || e),
    };
  }
}

// ── FCM (Firebase HTTP v1) ───────────────────────────────────────────
function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const b64urlStr = (s: string) => b64url(new TextEncoder().encode(s));

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}
function getServiceAccount(): ServiceAccount | null {
  const raw = Deno.env.get("FCM_SERVICE_ACCOUNT");
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    if (sa?.client_email && sa?.private_key && sa?.project_id) return sa;
  } catch { /* fall through */ }
  return null;
}

async function importPk(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\\n/g, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

let tokenCache: { token: string; exp: number } | null = null;
async function getAccessToken(sa: ServiceAccount): Promise<string | null> {
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlStr(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64urlStr(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const key = await importPk(sa.private_key);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
  const jwt = `${unsigned}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) return null;
  tokenCache = { token: data.access_token, exp: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
  return data.access_token;
}

export async function sendFcm(token: string, payload: PushPayload): Promise<SendResult> {
  const sa = getServiceAccount();
  if (!sa) return { ok: false, error: "fcm_missing" };
  const at = await getAccessToken(sa);
  if (!at) return { ok: false, error: "fcm_auth_failed" };
  const message = {
    message: {
      token,
      notification: { title: payload.title, body: payload.body },
      // Data must be string→string; the app reads `link` to deep-link on tap.
      data: { link: payload.link || "", type: payload.type || "" },
      // No explicit channel_id → FCM uses its built-in fallback channel on
      // Android 8+, so the app doesn't need to pre-create a channel.
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    },
  };
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (res.ok) return { ok: true };
  const errText = await res.text().catch(() => "");
  const gone = res.status === 404 || /UNREGISTERED|INVALID_ARGUMENT|NOT_FOUND/i.test(errText);
  return { ok: false, gone, error: errText };
}
