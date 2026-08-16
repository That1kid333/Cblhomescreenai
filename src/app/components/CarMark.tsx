/**
 * The CBL car mark — the brand's own car, drawn complete.
 *
 * Why this exists: the same glyph was pasted into Blog.tsx, Directory.tsx and
 * Transportation.tsx, and the two ride banners (Travels airport, Directory
 * pickup) carried a TRUNCATED copy — 4 of its 16 paths. Four paths is two wheel
 * arches and two stray lines, which is why it never read as a car and why Keith
 * kept asking what was going on with that icon.
 *
 * One definition, so a partial copy can't drift into a page again.
 *
 * `stroke="currentColor"` means it inherits the surrounding text colour, so the
 * gold-on-black banners and any future placement work without extra props.
 */
export function CarMark({ size = 30, strokeWidth = 11 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size * (227.01 / 288)}
      viewBox="0 0 288 227.01"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M65.43,90.76l-13.2,21.57c-2.58,4.17-3.66,8.95-3.11,13.68l5.26,45.23h89.57" />
      <path d="M65.43,90.76s-5.61-4.85-14.17-6.07c-8.56-1.23-14.41-.33-15.46,2.94-1.27,3.97-6.98,12.74,7.38,13.23" />
      <path d="M145.89,57.11s-49.54-.65-59.55,4.11c-8.76,4.17-18.6,24.53-20.91,29.54" />
      <path d="M110.99,134.64s-12.2-.65-28.8-1.3c-16.6-.65-13.42-11.26-13.42-11.26" />
      <path d="M110.99,152.62h69.8" />
      <path d="M64.93,91.59s3.11,4.94,14.34,4.94h66.01" />
      <path d="M222.56,90.76l13.2,21.57c2.58,4.17,3.66,8.95,3.11,13.68l-5.26,45.23h-89.57" />
      <path d="M222.56,90.76s5.61-4.85,14.17-6.07c8.56-1.23,14.41-.33,15.46,2.94,1.27,3.97,6.98,12.74-7.38,13.23" />
      <path d="M142.11,57.11s49.54-.65,59.55,4.11c8.76,4.17,18.6,24.53,20.91,29.54" />
      <path d="M177,134.64s12.2-.65,28.8-1.3c16.6-.65,13.42-11.26,13.42-11.26" />
      <path d="M177,152.62h-69.8" />
      <path d="M223.07,91.59s-3.11,4.94-14.34,4.94h-66.01" />
    </svg>
  );
}
