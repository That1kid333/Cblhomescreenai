/**
 * Reusable FTC affiliate disclosure — required on every page/section that
 * contains Travelpayouts (or any affiliate) links, per the CBL media-kit
 * compliance rules. Self-contained inline styles so it drops into any page's
 * scoped-CSS block without collisions; on-brand (gold #C99742 on near-black,
 * JetBrains Mono eyebrow) and deliberately quiet so it reads as a disclosure,
 * not a promo.
 *
 * 13px is a floor, not a preference: the Expedia Group Travel Creator terms
 * (2026-08-13) require the disclosure at 13px minimum, in the same viewport as
 * the links and never behind a tap. Raising it here keeps ONE component that
 * satisfies the strictest partner we have, so no placement can drift below it.
 *
 * `inline` renders a compact one-liner (for tucking under a single affiliate
 * row, e.g. in the Directory); the default is the bordered band used beneath
 * an affiliate section on Attractions.
 */
const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
const GOLD = '#C99742';

export function AffiliateDisclosure({
  inline = false,
  maxWidth = 1280,
}: {
  inline?: boolean;
  maxWidth?: number;
}) {
  const text =
    'CityBucketList may earn a commission when you book through links on this page, at no extra cost to you.';

  if (inline) {
    return (
      <p
        style={{
          fontFamily: MONO,
          fontSize: 13,
          lineHeight: 1.5,
          letterSpacing: '.02em',
          color: '#6f6f6f',
          margin: '8px 0 0',
        }}
      >
        <span style={{ color: GOLD }}>Affiliate&nbsp;·&nbsp;</span>
        {text}
      </p>
    );
  }

  return (
    <section style={{ padding: '0 clamp(20px, 5vw, 48px) 8px' }}>
      <div
        style={{
          maxWidth,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          background: '#0F0F0F',
          border: '1px solid rgba(201,151,66,.22)',
          borderRadius: '14px 0 14px 0',
          padding: '12px 18px',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#9A9A9A' }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: GOLD, marginRight: 8 }}>
            Affiliate disclosure
          </span>
          {text}
        </p>
      </div>
    </section>
  );
}
