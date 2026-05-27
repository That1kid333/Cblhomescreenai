import { Outlet, Link } from 'react-router';
import { ChevronRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import logo from '../../assets/4e362ee0a6833a98e4906d2c5dffb87be8775f8e.png';

export function Layout() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

              <div className="relative">
                <Link to="/blog" className="text-white hover:text-[var(--brand-yellow)] transition-colors flex items-center gap-1 text-sm">
                  CBL BLOG
                </Link>
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
                      <Link to="/directory" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Directory <span className="text-[#FDB913]">· New Design</span>
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="https://directory.citybucketlist.com/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Local Classifieds <span className="text-gray-500">· Live</span>
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="https://directory.citybucketlist.com/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Shopping & Offers <span className="text-gray-500">· Live</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Spacer to maintain center alignment of nav after removing login button */}
            <div className="hidden lg:block w-[88px] lg:mr-8"></div>
          </div>

          {/* Mobile menu - shown when hamburger is tapped */}
          {mobileOpen && (
            <nav className="lg:hidden mt-4 flex flex-col border-t border-white/10 pt-1">
              {[
                { to: '/our-story', label: 'Our Story' },
                { to: '/meet-buckee', label: 'Meet the Buckee Family' },
                { to: '/travels', label: 'Travels' },
                { to: '/transportation', label: 'Transportation' },
                { to: '/eats-and-drinks', label: 'Eats & Drinks' },
                { to: '/attractions', label: 'Attractions' },
                { to: '/blog', label: 'CBL Blog' },
                { to: '/directory', label: 'Directory' },
                { to: '/concierge', label: 'Hotel & Concierge Program' },
                { to: '/affiliates', label: 'Affiliates' },
                { to: '/partner-restaurants', label: 'Partner Restaurants' },
                { to: '/partner-attractions', label: 'Partner Attractions' },
                { to: '/faq', label: 'FAQ' },
                { to: '/contact', label: 'Contact' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-sm text-white hover:text-[#FDB913] border-b border-gray-700 border-dotted transition-colors uppercase tracking-wide"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href="https://directory.citybucketlist.com/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="py-3 text-sm text-white hover:text-[#FDB913] transition-colors uppercase tracking-wide"
              >
                Local Classifieds (Live)
              </a>
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
          <div className="flex items-center gap-6 text-[10px] uppercase">
            <Link to="/our-story" className="hover:text-[#FDB913] transition-colors">Story</Link>
            <Link to="/faq" className="hover:text-[#FDB913] transition-colors">FAQ</Link>
            <Link to="/contact" className="hover:text-[#FDB913] transition-colors">Contact</Link>
            <Link to="/affiliates" className="hover:text-[#FDB913] transition-colors">Partners</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
