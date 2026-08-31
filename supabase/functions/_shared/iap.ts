// Store receipt verification — Apple App Store Server API and Google Play
// Developer API.
//
// The client tells us nothing we trust. A purchase arriving from the app is
// just a claim; the entitlement is granted only after the store itself
// confirms it. A forged receipt is otherwise a free Elite plan, and it is the
// single most common way IAP integrations get exploited.
//
// Apple: App Store Server API (StoreKit 2 era). Auth is an ES256 JWT signed
// with an App Store Connect API key. The legacy /verifyReceipt endpoint is
// deprecated and deliberately not used here.
//
// Google: Play Developer API purchases.subscriptionsv2.get. Auth is a service
// account, exchanged for an OAuth access token via the JWT bearer grant.
//
// Required secrets:
//   APPLE_ISSUER_ID          App Store Connect API issuer (UUID)
//   APPLE_KEY_ID             the .p8 key id
//   APPLE_PRIVATE_KEY        the .p8 contents, PEM, newlines preserved
//   APPLE_BUNDLE_ID          com.rgossips
//   GOOGLE_SERVICE_ACCOUNT   the service-account JSON, verbatim
//   ANDROID_PACKAGE_NAME     com.rgossips

export type Platform = "ios" | "android";

export type VerifiedSubscription = {
  /** Stable store identity across renewals. */
  storeSubscriptionId: string;
  latestTransactionId: string | null;
  productId: string;
  expiresAt: string | null;
  autoRenewing: boolean;
  environment: "production" | "sandbox";
  status: "active" | "grace" | "on_hold" | "paused" | "cancelled" | "expired" | "refunded";
  /**
   * Our own user id, echoed back by the store because the client attached it
   * at purchase time (obfuscatedAccountIdAndroid / appAccountToken).
   *
   * This is what lets a notification stand on its own. Google publishes
   * SUBSCRIPTION_PURCHASED the instant payment completes — before the client
   * has called verify-iap-purchase — so the webhook routinely sees a token it
   * has no row for. Usually harmless, because the client's call lands a moment
   * later. But if the client never completes (app killed mid-payment, network
   * dropped), the purchase exists at the store and nowhere else, and the one
   * message that could have repaired it carried no way to identify the buyer.
   * With this, the webhook can create the row itself.
   */
  externalAccountId: string | null;
  raw: unknown;
};

/* ───────────────────────────── shared ───────────────────────────── */

function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ───────────────────────────── Apple ───────────────────────────── */

// App Store Server API tokens are short-lived by contract — Apple rejects
// anything older than 60 minutes. 20 keeps us clear of clock skew.
async function appleAuthToken(): Promise<string> {
  const issuerId = Deno.env.get("APPLE_ISSUER_ID");
  const keyId = Deno.env.get("APPLE_KEY_ID");
  const privateKey = Deno.env.get("APPLE_PRIVATE_KEY");
  const bundleId = Deno.env.get("APPLE_BUNDLE_ID");
  if (!issuerId || !keyId || !privateKey || !bundleId) {
    throw new Error("Apple IAP secrets are not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 20 * 60,
    aud: "appstoreconnect-v1",
    bid: bundleId,
  };

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(privateKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${b64url(new Uint8Array(sig))}`;
}

// Apple returns signed JWS payloads. The signature chain is Apple's own and
// the response arrives over TLS from Apple's host, so decoding the payload is
// sufficient here — we are not accepting these from the client.
function decodeJws<T>(jws: string): T {
  const part = jws.split(".")[1];
  const pad = part.length % 4 ? "=".repeat(4 - (part.length % 4)) : "";
  const json = atob(part.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return JSON.parse(json) as T;
}

export async function verifyApple(transactionId: string): Promise<VerifiedSubscription> {
  const token = await appleAuthToken();

  // Try production first, then sandbox. Apple's guidance: never branch on a
  // build flag, because review runs sandbox receipts against the production
  // binary and would otherwise fail every time.
  const hosts = [
    "https://api.storekit.itunes.apple.com",
    "https://api.storekit-sandbox.itunes.apple.com",
  ];

  let lastErr = "";
  for (const host of hosts) {
    const res = await fetch(`${host}/inApps/v1/subscriptions/${transactionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) {
      lastErr = "transaction not found";
      continue;
    }
    if (!res.ok) {
      lastErr = `Apple responded ${res.status}`;
      continue;
    }

    const body = await res.json();
    const item = body?.data?.[0]?.lastTransactions?.[0];
    if (!item?.signedTransactionInfo) {
      lastErr = "no transaction in Apple response";
      continue;
    }

    const tx = decodeJws<Record<string, any>>(item.signedTransactionInfo);
    const renewal = item.signedRenewalInfo
      ? decodeJws<Record<string, any>>(item.signedRenewalInfo)
      : {};

    // Apple's numeric status: 1 active, 2 expired, 3 billing retry,
    // 4 grace period, 5 revoked.
    const statusMap: Record<number, VerifiedSubscription["status"]> = {
      1: "active",
      2: "expired",
      3: "on_hold",
      4: "grace",
      5: "refunded",
    };

    const expiresMs = Number(tx.expiresDate ?? 0);
    return {
      storeSubscriptionId: String(tx.originalTransactionId),
      latestTransactionId: tx.transactionId ? String(tx.transactionId) : null,
      productId: String(tx.productId),
      expiresAt: expiresMs ? new Date(expiresMs).toISOString() : null,
      autoRenewing: renewal?.autoRenewStatus === 1,
      environment: tx.environment === "Sandbox" ? "sandbox" : "production",
      status: statusMap[Number(item.status)] ?? "expired",
      // Apple's equivalent of Google's obfuscated account id. Set by the
      // client as appAccountToken; Apple requires it to be a UUID, which our
      // auth user ids already are.
      externalAccountId: tx.appAccountToken ? String(tx.appAccountToken) : null,
      raw: { transaction: tx, renewal },
    };
  }

  throw new Error(`Apple verification failed: ${lastErr || "unknown"}`);
}

/* ───────────────────────────── Google ───────────────────────────── */

async function googleAccessToken(): Promise<string> {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT is not configured");
  const sa = JSON.parse(raw);

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${signingInput}.${b64url(new Uint8Array(sig))}`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status}`);
  }
  const body = await res.json();
  return body.access_token as string;
}

export async function verifyGoogle(purchaseToken: string): Promise<VerifiedSubscription> {
  const pkg = Deno.env.get("ANDROID_PACKAGE_NAME");
  if (!pkg) throw new Error("ANDROID_PACKAGE_NAME is not configured");
  const token = await googleAccessToken();

  const res = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/subscriptionsv2/tokens/${purchaseToken}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Google verification failed: ${res.status}`);
  }
  const body = await res.json();

  const line = body?.lineItems?.[0];
  const state: string = body?.subscriptionState || "";
  const statusMap: Record<string, VerifiedSubscription["status"]> = {
    SUBSCRIPTION_STATE_ACTIVE: "active",
    SUBSCRIPTION_STATE_IN_GRACE_PERIOD: "grace",
    SUBSCRIPTION_STATE_ON_HOLD: "on_hold",
    SUBSCRIPTION_STATE_PAUSED: "paused",
    SUBSCRIPTION_STATE_CANCELED: "cancelled",
    SUBSCRIPTION_STATE_EXPIRED: "expired",
    SUBSCRIPTION_STATE_PENDING: "on_hold",
  };

  return {
    // Google has no originalTransactionId; the purchase token is the stable
    // identity and survives renewals. It DOES change on resubscribe, which the
    // upsert handles by writing a new row.
    storeSubscriptionId: purchaseToken,
    latestTransactionId: body?.latestOrderId ? String(body.latestOrderId) : null,
    productId: String(line?.productId || ""),
    expiresAt: line?.expiryTime ? new Date(line.expiryTime).toISOString() : null,
    autoRenewing: !!line?.autoRenewingPlan?.autoRenewEnabled,
    environment: body?.testPurchase ? "sandbox" : "production",
    status: statusMap[state] ?? "expired",
    externalAccountId:
      body?.externalAccountIdentifiers?.obfuscatedExternalAccountId
        ? String(body.externalAccountIdentifiers.obfuscatedExternalAccountId)
        : null,
    raw: body,
  };
}

/* ─────────────────────── SKU → entitlement ─────────────────────── */

// Store product ids carry the plan and cycle. Keeping the mapping explicit
// rather than parsing the string means a typo in a store SKU fails loudly at
// verification instead of silently granting the wrong tier.
export const PRODUCT_MAP: Record<string, { plan: string; cycle: string }> = {
  "rgossips.starter.monthly": { plan: "starter", cycle: "monthly" },
  "rgossips.starter.annual": { plan: "starter", cycle: "annual" },
  "rgossips.pro.monthly": { plan: "pro", cycle: "monthly" },
  "rgossips.pro.annual": { plan: "pro", cycle: "annual" },
  "rgossips.elite.monthly": { plan: "elite", cycle: "monthly" },
  "rgossips.elite.annual": { plan: "elite", cycle: "annual" },
};

/** Store statuses that should leave the user holding their plan. */
export const ENTITLING_STATUSES = new Set(["active", "grace"]);
