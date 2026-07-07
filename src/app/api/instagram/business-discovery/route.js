import { NextResponse } from "next/server";

// Server-side proxy for the Instagram Business Discovery lookup used
// during creator signup. Previously the client called the Graph API
// directly with process.env.NEXT_PUBLIC_INSTA_OAUTH_TOKEN — which Next
// inlines into the browser bundle, exposing a long-lived Meta token that
// anyone could extract and use against the Graph API as our app. Moving
// the call server-side keeps the token off the wire.
//
// Reads server-only env first, falling back to the legacy NEXT_PUBLIC_
// names so nothing breaks before those are renamed. Once the client no
// longer references the NEXT_PUBLIC_ vars, they are no longer inlined
// into the bundle even if still named that way in .env.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN =
  process.env.INSTA_OAUTH_TOKEN ||
  process.env.NEXT_PUBLIC_INSTA_OAUTH_TOKEN ||
  "";
const IG_BUSINESS_ID =
  process.env.INSTA_APP_ID || process.env.NEXT_PUBLIC_APP_ID || "";

export async function POST(req) {
  try {
    const { username: raw } = await req.json().catch(() => ({}));
    const username = String(raw || "").replace(/^@/, "").trim();

    if (!username) {
      return NextResponse.json(
        { error: "Please enter a username first." },
        { status: 400 }
      );
    }
    // Basic input hardening: IG handles are [a-z0-9._]. Reject anything
    // else so we can't be coerced into building a weird Graph URL.
    if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) {
      return NextResponse.json(
        { error: "That doesn't look like a valid Instagram username." },
        { status: 400 }
      );
    }
    if (!TOKEN || !IG_BUSINESS_ID) {
      console.error(
        JSON.stringify({
          severity: "error",
          event: "instagram.business_discovery.misconfigured",
          hasToken: !!TOKEN,
          hasBusinessId: !!IG_BUSINESS_ID,
        })
      );
      return NextResponse.json(
        { error: "Instagram lookup is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const url =
      `https://graph.facebook.com/v21.0/${IG_BUSINESS_ID}` +
      `?fields=business_discovery.username(${username})` +
      `{id,username,followers_count,media_count,profile_picture_url,biography}` +
      `&access_token=${TOKEN}`;

    const resp = await fetch(url, { cache: "no-store" });
    const data = await resp.json().catch(() => ({}));

    if (data?.error) {
      // Log the Graph error server-side (no token in the log), return a
      // clean user-facing message. Meta code 100 = not a Business/Creator.
      console.warn(
        JSON.stringify({
          severity: "warn",
          event: "instagram.business_discovery.graph_error",
          username,
          code: data.error.code,
          type: data.error.type,
        })
      );
      return NextResponse.json(
        {
          error:
            data.error.code === 100
              ? "Account not found. Make sure it's a public Creator or Business account."
              : "Could not validate that account right now. Please try again.",
        },
        { status: 422 }
      );
    }

    const d = data?.business_discovery;
    if (!d) {
      return NextResponse.json(
        { error: "Account not found or not a public Creator/Business profile." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      username: d.username,
      followers_count: d.followers_count,
      profile_picture_url: d.profile_picture_url,
      biography: d.biography,
      id: d.id,
      media_count: d.media_count,
    });
  } catch (err) {
    console.error(
      JSON.stringify({
        severity: "error",
        event: "instagram.business_discovery.exception",
        error: err?.message || String(err),
      })
    );
    return NextResponse.json(
      { error: "Something went wrong validating that account. Please try again." },
      { status: 500 }
    );
  }
}
