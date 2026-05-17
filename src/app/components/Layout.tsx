import { Outlet, Link } from 'react-router';
import { ChevronRight, Menu } from 'lucide-react';
import { useState } from 'react';
import logo from 'figma:asset/4e362ee0a6833a98e4906d2c5dffb87be8775f8e.png';

export function Layout() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

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
    <div className="bg-black text-white min-h-screen w-full">
      {/* Header */}
      <header className="">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu - Mobile Only (Far Left) */}
            <button className="lg:hidden text-white hover:text-[#FDB913] transition-colors">
              <Menu className="w-6 h-6" />
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
                <a href="#about" className="text-white hover:text-[var(--brand-yellow)] transition-colors flex items-center gap-1 text-sm">
                  ABOUT <ChevronRight className={`w-4 h-4 text-[#FDB913] transition-transform ${activeDropdown === 'about' ? 'rotate-90' : ''}`} />
                </a>
                {activeDropdown === 'about' && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-black shadow-xl z-50">
                    <div className="py-2">
                      <Link to="/our-story" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Our Story
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
                <a href="#explore" className="text-white hover:text-[var(--brand-yellow)] transition-colors flex items-center gap-1 text-sm">
                  EXPLORE <ChevronRight className={`w-4 h-4 text-[#FDB913] transition-transform ${activeDropdown === 'explore' ? 'rotate-90' : ''}`} />
                </a>
                {activeDropdown === 'explore' && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-black shadow-xl z-50">
                    <div className="py-2">
                      <a href="#travels" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Travels
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="#transportation" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Transportation
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <Link to="/eats-and-drinks" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Eats & Drinks
                      </Link>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="#attractions" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Attractions
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('affiliates')}
                onMouseLeave={handleMouseLeave}
              >
                <a href="#affiliates" className="text-white hover:text-[var(--brand-yellow)] transition-colors flex items-center gap-1 text-sm">
                  AFFILIATES <ChevronRight className={`w-4 h-4 text-[#FDB913] transition-transform ${activeDropdown === 'affiliates' ? 'rotate-90' : ''}`} />
                </a>
                {activeDropdown === 'affiliates' && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-black shadow-xl z-50">
                    <div className="py-2">
                      <a href="#become-affiliate" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Become An Affiliate
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="#partner-hotels" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Partner Hotels
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="#partner-restaurants" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Partner Restaurants
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="#partner-attractions" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Partner Attractions
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="#commission-info" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Commission Info
                      </a>
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
                      <a href="#latest-posts" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Travels
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="#travel-tips" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Transportation
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="#local-guides" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Eats & Drinks
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="#destination-spotlights" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Attractions
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('directory')}
                onMouseLeave={handleMouseLeave}
              >
                <a href="#directory" className="text-white hover:text-[var(--brand-yellow)] transition-colors flex items-center gap-1 text-sm">
                  DIRECTORY & SAVINGS <ChevronRight className={`w-4 h-4 text-[#FDB913] transition-transform ${activeDropdown === 'directory' ? 'rotate-90' : ''}`} />
                </a>
                {activeDropdown === 'directory' && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-black shadow-xl z-50">
                    <div className="py-2">
                      <a href="https://directory.citybucketlist.com/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Local Businesses
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="https://directory.citybucketlist.com/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Drivers & Riders
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="https://directory.citybucketlist.com/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Local Classifieds
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                      <a href="https://directory.citybucketlist.com/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black transition-colors">
                        Shopping & Offers
                      </a>
                      <div className="border-b border-gray-600 border-dotted mx-4"></div>
                    <a href="https://directory.citybucketlist.com/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black">Travel Deals</a>
                    <div className="border-b border-gray-600 border-dotted mx-4"></div>
                    <a href="https://directory.citybucketlist.com/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-white hover:bg-[#FDB913] hover:text-black">Partners & Affiliates</a>
                    </div>
                  </div>
                )}
              </div>
            </nav>


          </div>
        </div>
      </header>

      {/* Main Content */}
      <Outlet />

      {/* Footer */}
      <footer className="mt-8 lg:mt-4">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 lg:py-3">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <p className="text-gray-400 text-xs lg:text-sm">
              <span className="font-semibold">Special Thanks</span> to our Sponsors & Affiliates!
            </p>
            <div className="bg-orange-500 px-3 lg:px-4 py-1.5 lg:py-2 rounded">
              <span className="text-white font-bold text-xs lg:text-sm">KAYAK</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
