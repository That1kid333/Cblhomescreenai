import { useEffect, useState, type ReactNode } from "react";

/**
 * Reusable "Software Platform Notice" — the SaaS / not-a-rideshare / independent-
 * contractor / not-a-party + LLC/copyright box Keith wanted echoed across the
 * site (first written as the Directory driver disclaimer). Self-contained inline
 * styles so it drops into any page's scoped-CSS block without collisions.
 *
 * variant:
 *   "rides"       — ride pages (Transportation): drivers, scheduled rides.
 *   "marketplace" — listings/partners/bookings (Eats, Travels, Attractions,
 *                   Directory shopping): third-party sellers & bookings.
 */
const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";

const b = (t: ReactNode, c = "#C0C0C0") => <b style={{ color: c }}>{t}</b>;

// Shared collapsible shell for the site's legal notices. Box width matches the
// pages' content (.band-inner, 1280) so it lines up edge-to-edge. Expanded on
// desktop; collapsed on phones (tap the chevron for the detail) so the legal
// text doesn't eat vertical space on mobile.
export function CollapsibleLegal({
  title,
  maxWidth = 1280,
  children,
}: {
  title: string;
  maxWidth?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    // Collapse by default on small screens only.
    setOpen(!window.matchMedia("(max-width: 640px)").matches);
  }, []);
  return (
    <section className="cbl-platform-notice" style={{ padding: "0 clamp(20px, 5vw, 48px) 8px" }}>
      <style>{`.cbl-legal>summary{list-style:none}.cbl-legal>summary::-webkit-details-marker{display:none}.cbl-legal>summary:focus-visible{outline:2px solid #C99742;outline-offset:2px}`}</style>
      <details
        className="cbl-legal"
        open={open}
        onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
        style={{
          maxWidth,
          margin: "0 auto",
          background: "#0F0F0F",
          border: "1px solid rgba(201,151,66,.28)",
          borderRadius: "18px 0 18px 0",
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 22px",
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "#C99742", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
            </svg>
            {title}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C99742" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, transition: "transform .22s ease", transform: open ? "rotate(180deg)" : "none" }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div style={{ padding: "0 22px 20px" }}>{children}</div>
      </details>
    </section>
  );
}

export function PlatformNotice({
  variant = "rides",
  maxWidth = 1280,
}: {
  variant?: "rides" | "marketplace";
  maxWidth?: number;
}) {
  const body =
    variant === "marketplace" ? (
      <>
        {b(
          "City Bucket List is a software-as-a-service (SaaS) platform — not a restaurant, retailer, travel agency, tour operator, or ticket seller.",
          "#DDB15F",
        )}{" "}
        We provide software that helps members discover and connect with{" "}
        {b("independent businesses and third-party providers")}; the businesses, listings, prices,
        bookings, and reservations shown here are provided by those{" "}
        {b("independent third parties")}, not by City Bucket List. We{" "}
        {b("do not sell, supply, or fulfill")} any product, meal, stay, tour, or ticket, and we are{" "}
        {b("not a party to any transaction, booking, or reservation")} you make. Any purchase or
        booking is solely between you and the provider, on their terms; each provider is responsible
        for its own offerings, pricing, licensing, and compliance with applicable law. You use these
        listings {b("at your own risk")}.
      </>
    ) : (
      <>
        {b(
          "City Bucket List is a software-as-a-service (SaaS) platform — not a rideshare company, transportation provider, or passenger carrier.",
          "#DDB15F",
        )}{" "}
        We provide software that independent drivers use to manage their own{" "}
        {b("private, scheduled rides")}; we {b("do not own vehicles, employ or dispatch drivers, set fares, or provide transportation")}.
        Drivers are {b("independent contractors")}, not employees or agents of City Bucket List.
        Members and drivers arrange {b("private, scheduled rides directly with each other")}, and each
        driver decides, {b("at their sole discretion")}, whether to accept any request. City Bucket
        List is {b("not a party to any ride")} and accepts no liability for it; riders and drivers are
        responsible for their own licensing, insurance, safety, and compliance with applicable law,
        and interact {b("at their own risk")}.
      </>
    );

  return (
    <CollapsibleLegal title="Software Platform Notice" maxWidth={maxWidth}>
      <p style={{ fontSize: 12.5, lineHeight: 1.65, color: "#9A9A9A", margin: 0 }}>{body}</p>
      <p style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.6, color: "#6f6f6f", margin: "12px 0 0", letterSpacing: ".02em" }}>
        &copy; {new Date().getFullYear()} Citybucketlist.com, LLC. All rights reserved. City Bucket
        List&trade; is a service of Citybucketlist.com, LLC.
      </p>
    </CollapsibleLegal>
  );
}
