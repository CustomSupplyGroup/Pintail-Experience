// Waiver text. This is PLACEHOLDER language until Isaac swaps in the final,
// attorney-reviewed release. Replacing the real waiver is a one-constant edit:
// set PLACEHOLDER_WAIVER_TEXT to the final copy and flip WAIVER_IS_DRAFT to
// false (which hides the on-screen "DRAFT — not legally binding" banner).

export const WAIVER_IS_DRAFT = true;

/** Bump when the finalized text changes — stored on each signed waiver row. */
export const WAIVER_VERSION = "draft-2026-07";

export const WAIVER_TITLE =
  "Acknowledgement of Risk & Release of Liability";

export const PLACEHOLDER_WAIVER_TEXT = `Hunting and outdoor activities carry inherent risks, including but not limited to firearms use, boats and cold water, uneven terrain, weather, and travel.

By signing below, I acknowledge those risks and voluntarily assume them. I release The Pintail Experience, its hosts, guides, vendors, and partners from liability for injury, illness, or loss arising from my participation, to the fullest extent permitted by law.

I confirm that I am physically able to participate, that I will follow all safety instructions given by the hosts and guides, and that the information I have provided is accurate.`;
