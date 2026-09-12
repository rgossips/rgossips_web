// The budget figure a creator sees for a campaign — shared by the list card
// and the campaign detail page so the two can never disagree about it.
//
// A barter campaign has no cash budget, so list-campaigns reports its budget
// as "On request". That is accurate but it hides the one number a creator
// actually wants: what the product is worth. brand-campaigns stores that as
// product_value and list-campaigns already returns it as `productValue`.
//
// Every figure here reads as a ceiling — "Up to ₹X" — because that is what
// both of them are: product_value is what the item is worth, and
// budget_per_influencer is the most the brand will pay, with the creator
// pitching a rate under it. The only text left unprefixed is a non-amount
// like "On request", which a barter campaign with no product value keeps
// rather than having a number invented for it.
export function campaignBudgetDisplay(campaign) {
  const type = String(campaign?.campaignType || "").toLowerCase();
  const productValue = Number(campaign?.productValue) || 0;
  if (type === "barter" && productValue > 0) {
    return { text: `Up to ₹${productValue.toLocaleString("en-IN")}`, isProductValue: true };
  }

  // Cash budgets read "Up to ₹X" too. budget_per_influencer is the ceiling a
  // brand is willing to pay, not a fixed fee — the creator pitches a rate and
  // the brand approves one at or under it — so a bare "₹11,708" promised a
  // number nobody had agreed to yet.
  //
  // Gated on the leading ₹ rather than on campaign type: list-campaigns emits
  // "On request" when no budget is set, and "Up to On request" is nonsense.
  // That also covers hybrid, whose cash leg is the same field with the same
  // ceiling meaning.
  const budget = campaign?.budget || "";
  if (budget.startsWith("₹")) return { text: `Up to ${budget}`, isProductValue: false };
  return { text: budget, isProductValue: false };
}
