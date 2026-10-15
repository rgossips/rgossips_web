// Does this campaign run the product-reimbursement flow?
//
// The flag lives in the campaign description's metadata trailer as
// `include_product_reimbursement`, alongside shipping_required and
// product_value — the same place every other campaign extra lives, so
// adding one more brief field needed no migration. Migration 087 holds the
// per-application STATE, which does.
//
// One owner, because three functions ask the question and a disagreement
// between them would either gate a campaign that should flow freely or let
// a creator skip the step: update-application-status (open the step on
// approval), application-reimbursement (run it) and submit-deliverables
// (refuse until it is done).

export function requiresReimbursement(description: string | null | undefined): boolean {
  if (!description) return false;
  const i = String(description).lastIndexOf("\n---\n");
  if (i === -1) return false;
  try {
    const meta = JSON.parse(String(description).slice(i + 5));
    const v = meta?.include_product_reimbursement;
    return v === true || v === "true" || v === 1 || v === "1";
  } catch {
    return false;
  }
}

/** Deliverables stay locked until the brand has reimbursed. */
export function reimbursementBlocksDeliverables(
  description: string | null | undefined,
  reimbursementStatus: string | null | undefined,
): boolean {
  if (!requiresReimbursement(description)) return false;
  return String(reimbursementStatus || "") !== "reimbursed";
}
