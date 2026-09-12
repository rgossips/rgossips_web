import { campaignBudgetDisplay } from "@/utils/campaignBudget";

// The list card and the campaign detail page both render this, so these pin
// the one rule they share: a barter campaign shows what its product is worth,
// everything else shows the server's budget string untouched.
describe("campaignBudgetDisplay", () => {
  it("shows a barter campaign's product value as an upper bound", () => {
    expect(
      campaignBudgetDisplay({ campaignType: "barter", productValue: 2399, budget: "On request" }),
    ).toEqual({ text: "Up to ₹2,399", isProductValue: true });
  });

  it("formats large values with Indian digit grouping", () => {
    expect(campaignBudgetDisplay({ campaignType: "barter", productValue: 150000 }).text).toBe(
      "Up to ₹1,50,000",
    );
  });

  it("keeps the server string for a barter campaign with no product value", () => {
    // Inventing a number would be worse than saying "On request".
    expect(
      campaignBudgetDisplay({ campaignType: "barter", productValue: 0, budget: "On request" }),
    ).toEqual({ text: "On request", isProductValue: false });
  });

  it("presents a paid campaign's cash budget as a ceiling", () => {
    // budget_per_influencer is the most the brand will pay, not a fixed fee.
    expect(
      campaignBudgetDisplay({ campaignType: "paid", productValue: 5000, budget: "₹11,708" }),
    ).toEqual({ text: "Up to ₹11,708", isProductValue: false });
  });

  it("treats a hybrid campaign's cash leg the same way", () => {
    expect(
      campaignBudgetDisplay({ campaignType: "hybrid", productValue: 3500, budget: "₹8,000" }).text,
    ).toBe("Up to ₹8,000");
  });

  it("never prefixes a non-amount like \"On request\"", () => {
    // "Up to On request" is nonsense; the ₹ check is what prevents it.
    expect(campaignBudgetDisplay({ campaignType: "paid", budget: "On request" }).text).toBe(
      "On request",
    );
  });

  it("treats the type case-insensitively and survives missing fields", () => {
    expect(campaignBudgetDisplay({ campaignType: "BARTER", productValue: "999" }).text).toBe("Up to ₹999");
    expect(campaignBudgetDisplay({})).toEqual({ text: "", isProductValue: false });
    expect(campaignBudgetDisplay(null)).toEqual({ text: "", isProductValue: false });
  });
});
