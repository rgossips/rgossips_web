import { redirect } from "next/navigation";

// `/influencer/profile/payments` is linked from notifications and emails
// (escrow-release, razorpay-webhook, admin-escrow-resolve) but never existed
// as a route — PaymentMethods is a VIEW inside /influencer/profile, switched
// by local state. Every "add a payout method" notification therefore landed on
// a 404, which is exactly the flow that matters most: the creator has money
// waiting and is being told to go somewhere that isn't there.
//
// Those links are already out in inboxes, so the fix is a real route that
// forwards rather than editing the senders. `?add=1` is preserved so the
// add-method sheet still opens on arrival.
export default async function PaymentsRedirect({ searchParams }) {
  const params = await searchParams;
  const add = params?.add === "1" ? "&add=1" : "";
  redirect(`/influencer/profile?view=payments${add}`);
}
