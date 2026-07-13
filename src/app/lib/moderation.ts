// Lightweight content screen for member-posted directory listings. It runs at
// submit time (client-side, inside postDirectoryListing) so obvious solicitation,
// adult, or hateful posts are blocked BEFORE they ever save — there is NO
// approval queue and NO daily moderation chore for the CBL team. That's the whole
// point: policing that runs itself.
//
// This is a first-pass DETERRENT, not a perfect filter. Because it runs in the
// browser a determined user could bypass it by hitting the API directly, so it's
// paired with two other layers already in place:
//   1. Members-only posting — every listing is tied to a real, bannable account
//      (RLS: auth.uid() = user_id), so there's accountability behind each post.
//   2. (Optional, later) a matching server-side DB rule for bypass-proof
//      enforcement, and/or an AI-moderation pass for euphemisms this list misses.
//
// Keep the patterns TIGHT and word-boundaried so ordinary classifieds (pet ads,
// auto parts, furniture, ride requests) never trip a false positive.

const BLOCKED: RegExp[] = [
  // --- sexual solicitation / hookups ---
  /\bhook(?:ing)?[\s-]?up(?:s|ping)?\b/i,
  /\blooking\s+to\s+hook\b/i,
  /\bf\.?w\.?b\.?\b/i,
  /\bone[\s-]?night[\s-]?stand\b/i,
  /\bfriends?\s+with\s+benefits\b/i,
  /\bnetflix\s+and\s+chill\b/i,
  /\bdiscreet\s+(?:fun|encounter|meet|hookup)/i,
  // --- adult commerce / explicit ---
  /\bescorts?\b/i,
  /\bsugar\s?(?:daddy|baby|mama|momma)\b/i,
  /\bhappy\s+ending\b/i,
  /\bonlyfans\b/i,
  /\bcam[\s-]?(?:girl|boy|model)s?\b/i,
  /\bnudes?\b/i,
  /\bporn(?:o|ography)?\b/i,
  /\bxxx\b/i,
  /\bstripper(?:s|gram)?\b/i,
  /\bsexual\s+(?:favor|service|encounter)/i,
  /\bmassage\s+(?:with\s+)?(?:happy\s+ending|extras?|benefits)/i,
  // --- illegal drug sales ---
  /\b(?:cocaine|heroin|fentanyl)\b/i,
  /\b(?:meth|weed|marijuana|molly)\s+for\s+sale\b/i,
  // --- hate slurs (compact, unambiguous; extend as needed) ---
  /\bn[i1]gg(?:er|a)s?\b/i,
  /\bf[a4]gg(?:ot|ots|s)?\b/i,
  /\bk[i1]ke\b/i,
  /\btr[a4]nny\b/i,
];

export type ScreenResult = { ok: boolean; reason: string };

const GUIDELINE_MESSAGE =
  "That post looks like it breaks our community guidelines — no solicitation, " +
  "adult content, or hateful/harassing language. Please edit it and try again.";

// Screen any number of text fields (title, description, …) together. Returns
// ok:false with a friendly, actionable reason when something is blocked.
export function screenListing(...parts: (string | null | undefined)[]): ScreenResult {
  const text = parts.filter(Boolean).join(" ");
  if (!text.trim()) return { ok: true, reason: "" };
  for (const re of BLOCKED) {
    if (re.test(text)) return { ok: false, reason: GUIDELINE_MESSAGE };
  }
  return { ok: true, reason: "" };
}
