// One-shot debug: read a Stripe subscription's actual price + metadata.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const subId = url.searchParams.get("sub") || "";
    if (!subId) return new Response(JSON.stringify({ error: "?sub= required" }), { status: 400 });

    // POST = cancel; GET = inspect.
    if (req.method === "POST") {
      const cancelled = await stripe.subscriptions.cancel(subId);
      return new Response(
        JSON.stringify({ ok: true, id: cancelled.id, status: cancelled.status }, null, 2),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const sub = await stripe.subscriptions.retrieve(subId, { expand: ["items.data.price.product"] });
    const item = sub.items.data[0];
    return new Response(
      JSON.stringify(
        {
          id: sub.id,
          status: sub.status,
          metadata: sub.metadata,
          customer: sub.customer,
          current_period_end: sub.current_period_end,
          item: {
            price_id: item?.price?.id,
            currency: item?.price?.currency,
            unit_amount: item?.price?.unit_amount,
            recurring: item?.price?.recurring,
            metadata: item?.price?.metadata,
            product: typeof item?.price?.product === "object" ? {
              id: (item.price.product as any).id,
              name: (item.price.product as any).name,
              metadata: (item.price.product as any).metadata,
            } : item?.price?.product,
          },
        },
        null,
        2
      ),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});
