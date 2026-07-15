import { Outlet, Link, ScrollRestoration } from 'react-router';
import { ChevronRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import logo from '../../assets/4e362ee0a6833a98e4906d2c5dffb87be8775f8e.png';
import { useAuth, firstNameOf } from '../lib/auth';
import { MemberCard } from './MemberCard';

// Mobile menu, grouped into the same categories as the desktop nav so the two
// stay consistent. Collapsed by default (accordion) to keep it short.
type MobileItem = { label: string; to?: string; href?: string; tag?: string };
type MobileSection = { label: string; to?: string; items?: MobileItem[] };
const MOBILE_NAV: MobileSection[] = [
  {
    label: 'About',
    items: [
      { label: 'Our Story', to: '/our-story' },
      { label: 'Meet the Buckee Family', to: '/meet-buckee' },
      { label: 'How It Works', to: '/how-it-works' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
  {
    label: 'Explore',
    items: [
      { label: 'Travels', to: '/travels' },
      { label: 'Transportation', to: '/transportation' },
      { label: 'Eats & Drinks', to: '/eats-and-drinks' },
      { label: 'Attractions', to: '/attractions' },
      { label: 'Delivery', to: '/delivery' },
    ],
  },
  {
    label: 'Affiliates',
    items: [
      { label: 'Hotel & Concierge Program', to: '/concierge' },
      { label: 'Become An Affiliate', to: '/affiliates' },
      { label: 'Partner Restaurants', to: '/partner-restaurants' },
      { label: 'Partner Attractions', to: '/partner-attractions' },
    ],
  },
  {
    label: 'CBL Blog',
    items: [
      { label: 'All Stories', to: '/blog' },
      { label: 'Transportation', to: '/blog?category=transportation' },
      { label: 'Travels', to: '/blog?category=travels' },
      { label: 'Eats & Drinks', to: '/blog?category=eats' },
      { label: 'Attractions', to: '/blog?category=attractions' },
    ],
  },
  {
    label: 'Directory & Savings',
    items: [
      { label: 'Classifieds', to: '/directory?section=CLASSIFIEDS' },
      { label: 'Driver Posts', to: '/directory?section=DRIVERS' },
      { label: 'Rider Requests', to: '/directory?section=RIDERS' },
      { label: 'Shopping', to: '/directory?section=SHOP' },
      { label: 'Coupons & Offers', to: '/directory?section=COUPONS' },
    ],
  },
];

export function Layout() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const { session, profile } = useAuth();
  const firstName = firstNameOf(profile, session);

  const handleMouseEnter = (dropdown: string) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setActiveDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
    setCloseTimeout(timeout);
  };

  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col">
      {/* Scroll to top on navigation; restore position on back/forward */}
      <ScrollRestoration />
      {/* Header */}
      <header className="">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu - Mobile Only (Far Left) */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              className="lg:hidden text-white hover:text-[#FDB913] transition-colors"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo - Centered on mobile, left-aligned on desktop */}
            <Link to="/" className="flex items-center absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
              <img
                src={logo}
                alt="CityBucketList.com"
                className="h-8 lg:h-12"
                style={{ filter: 'brightness(1.15) saturate(1.1)' }}
              />
            </Link>

            {/* Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center gap-6">
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('about')}
                onMouseLeave={handleMouseLeave}
              >
                <Link to="/our-story" className="text-white hover:text-[var(--brand-yellow)] transition-colors flex items-center gap-1 text-sm">
                  ABOUT <ChevronRight className={`w-4 h-4 text-[#FDB913] transition-transform ${activeDropdown === 'about' ? 'rotate-90' : ''}`} />
                </Link>
                {activeDropdown === 'about' && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-black shadow-xl z-50">
                    <div className="py-2">
                      <Link to="/our-story" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Our Story
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/meet-buckee" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Meet the Buckee Family
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/how-it-works" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        How It Works
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/faq" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        FAQ
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/contact" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Contact Us
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('explore')}
                onMouseLeave={handleMouseLeave}
              >
                <Link to="/travels" className="text-white hover:text-[var(--brand-yellow)] transition-colors flex items-center gap-1 text-sm">
                  EXPLORE <ChevronRight className={`w-4 h-4 text-[#FDB913] transition-transform ${activeDropdown === 'explore' ? 'rotate-90' : ''}`} />
                </Link>
                {activeDropdown === 'explore' && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-black shadow-xl z-50">
                    <div className="py-2">
                      <Link to="/travels" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Travels
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/transportation" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Transportation
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/eats-and-drinks" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Eats & Drinks
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/attractions" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Attractions
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/delivery" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Delivery
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('affiliates')}
                onMouseLeave={handleMouseLeave}
              >
                <Link to="/affiliates" className="text-white hover:text-[var(--brand-yellow)] transition-colors flex items-center gap-1 text-sm">
                  AFFILIATES <ChevronRight className={`w-4 h-4 text-[#FDB913] transition-transform ${activeDropdown === 'affiliates' ? 'rotate-90' : ''}`} />
                </Link>
                {activeDropdown === 'affiliates' && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-black shadow-xl z-50">
                    <div className="py-2">
                      <Link to="/concierge" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Hotel &amp; Concierge Program
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/affiliates" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Become An Affiliate
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/partner-restaurants" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Partner Restaurants
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/partner-attractions" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Partner Attractions
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('blog')}
                onMouseLeave={handleMouseLeave}
              >
                <Link to="/blog" className="text-white hover:text-[var(--brand-yellow)] transition-colors flex items-center gap-1 text-sm">
                  CBL BLOG <ChevronRight className={`w-4 h-4 text-[#FDB913] transition-transform ${activeDropdown === 'blog' ? 'rotate-90' : ''}`} />
                </Link>
                {activeDropdown === 'blog' && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-black shadow-xl z-50">
                    <div className="py-2">
                      <Link to="/blog?category=transportation" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Transportation
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/blog?category=travels" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Travels
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/blog?category=eats" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Eats &amp; Drinks
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/blog?category=attractions" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Attractions
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('directory')}
                onMouseLeave={handleMouseLeave}
              >
                <Link to="/directory" className="text-white hover:text-[var(--brand-yellow)] transition-colors flex items-center gap-1 text-sm">
                  DIRECTORY & SAVINGS <ChevronRight className={`w-4 h-4 text-[#FDB913] transition-transform ${activeDropdown === 'directory' ? 'rotate-90' : ''}`} />
                </Link>
                {activeDropdown === 'directory' && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-black shadow-xl z-50">
                    <div className="py-2">
                      <Link to="/directory?section=CLASSIFIEDS" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">Classifieds</Link>
                      <Link to="/directory?section=DRIVERS" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">Driver Posts</Link>
                      <Link to="/directory?section=RIDERS" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">Rider Requests</Link>
                      <Link to="/directory?section=SHOP" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">Shopping</Link>
                      <Link to="/directory?section=COUPONS" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">Coupons &amp; Offers</Link>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Right slot — keeps the nav centered on desktop (min 88px) and
                hosts the member avatar + welcome-back when signed in */}
            <div className="flex items-center justify-end lg:min-w-[88px] lg:mr-8">
              {session && (
                <>
                  <span className="hidden lg:block text-xs text-[#B8B8B8] mr-3 whitespace-nowrap">
                    Welcome back, <span className="text-[#FDB913] font-bold">{firstName}</span>
                  </span>
                  <button
                    onClick={() => setCardOpen(true)}
                    title={`Welcome back, ${firstName}!`}
                    aria-label={`Open your member card, ${firstName}`}
                    className="w-10 h-10 rounded-full border-2 border-[#C99742] hover:border-[#FDB913] transition-colors overflow-hidden grid place-items-center bg-[#141414] text-[#C99742] font-black text-base flex-shrink-0"
                  >
                    {profile?.photo ? (
                      <img src={profile.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{firstName.charAt(0)}</span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu - categorized accordion, mirrors the desktop nav */}
          {mobileOpen && (
            <nav className="lg:hidden mt-4 flex flex-col border-t border-white/10">
              {MOBILE_NAV.map((section) => {
                // Direct-link section (e.g. CBL Blog) — no sub-items.
                if (section.to && !section.items) {
                  return (
                    <Link
                      key={section.label}
                      to={section.to}
                      onClick={() => setMobileOpen(false)}
                      className="py-3.5 text-sm text-white hover:text-[#FDB913] border-b border-gray-700 border-dotted transition-colors uppercase tracking-wide font-semibold"
                    >
                      {section.label}
                    </Link>
                  );
                }
                const open = openSection === section.label;
                const closeMenu = () => setMobileOpen(false);
                return (
                  <div key={section.label} className="border-b border-gray-700 border-dotted">
                    <button
                      onClick={() => setOpenSection(open ? null : section.label)}
                      aria-expanded={open}
                      className="w-full flex items-center justify-between py-3.5 text-sm text-white hover:text-[#FDB913] transition-colors uppercase tracking-wide font-semibold"
                    >
                      {section.label}
                      <ChevronRight className={`w-4 h-4 text-[#FDB913] transition-transform ${open ? 'rotate-90' : ''}`} />
                    </button>
                    {open && (
                      <div className="flex flex-col pb-1.5">
                        {section.items!.map((it) =>
                          it.href ? (
                            <a
                              key={it.label}
                              href={it.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={closeMenu}
                              className="py-2.5 pl-4 text-[13px] text-[#B8B8B8] hover:text-[#FDB913] transition-colors uppercase tracking-wide"
                            >
                              {it.label}
                              {it.tag && <span className="text-[#FDB913] ml-1.5 text-[11px]">· {it.tag}</span>}
                            </a>
                          ) : (
                            <Link
                              key={it.label}
                              to={it.to!}
                              onClick={closeMenu}
                              className="py-2.5 pl-4 text-[13px] text-[#B8B8B8] hover:text-[#FDB913] transition-colors uppercase tracking-wide"
                            >
                              {it.label}
                              {it.tag && <span className="text-[#FDB913] ml-1.5 text-[11px]">· {it.tag}</span>}
                            </Link>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0A0A0A] py-8 lg:py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-500 font-mono tracking-wider">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <div>
              &copy; {new Date().getFullYear()} CITY BUCKET LIST, INC. ALL RIGHTS RESERVED.
            </div>
            <p className="text-[10px] text-gray-600 max-w-2xl font-sans normal-case tracking-normal">
              City Bucket List is a software-as-a-service (SaaS) platform and is not a rideshare company, transportation provider, or passenger carrier.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex items-center gap-4">
              <a href="https://www.youtube.com/@CitybucketlistCBL" target="_blank" rel="noopener noreferrer" aria-label="City Bucket List on YouTube" className="text-gray-500 hover:text-[#C99742] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.5 15.6V8.4l6.3 3.6-6.3 3.6Z" /></svg>
              </a>
              <a href="https://www.instagram.com/citybucketlist_pittsburgh/" target="_blank" rel="noopener noreferrer" aria-label="City Bucket List on Instagram" className="text-gray-500 hover:text-[#C99742] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5.5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" /></svg>
              </a>
              {/* Facebook group icon slots in here once the group link is confirmed */}
            </div>
            <div className="flex items-center gap-6 text-[10px] uppercase">
              <Link to="/our-story" className="hover:text-[#FDB913] transition-colors">Story</Link>
              <Link to="/faq" className="hover:text-[#FDB913] transition-colors">FAQ</Link>
              <Link to="/contact" className="hover:text-[#FDB913] transition-colors">Contact</Link>
              <Link to="/affiliates" className="hover:text-[#FDB913] transition-colors">Partners</Link>
            </div>
          </div>
        </div>
      </footer>

      <MemberCard open={cardOpen} onClose={() => setCardOpen(false)} />
    </div>
  );
}
