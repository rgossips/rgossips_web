// The budget figure a creator sees for a campaign — shared by the list card
// and the campaign detail page so the two can never disagree about it.
//
// A barter campaign has no cash budget, so list-campaigns reports its budget
// as "On request". That is accurate but it hides the one number a creator
// actually wants: what the product is worth. brand-campaigns stores that as
// product_value and list-campaigns already returns it as `productValue`.
//
// Barter only. A hybrid campaign has a real cash budget, which stays the
// headline figure; a barter campaign with no product value set keeps the
// server's "On request" rather than inventing a number.
export function campaignBudgetDisplay(campaign) {
  const type = String(campaign?.campaignType || "").toLowerCase();
  const productValue = Number(campaign?.productValue) || 0;
  if (type === "barter" && productValue > 0) {
    return { text: `Up to ₹${productValue.toLocaleString("en-IN")}`, isProductValue: true };
  }
  return { text: campaign?.budget || "", isProductValue: false };
}
