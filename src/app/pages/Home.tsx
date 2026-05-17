import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { CategoryButton } from '../components/CategoryButton';
import conciergeImage from 'figma:asset/9b0fc11a5ef647d02d147f7c1dee023bd105e175.png';
import transportationImage from 'figma:asset/0c14cb1865bf0ca612f6fcb9d74d4ff3578188ac.png';
import eatsImage from 'figma:asset/5f602f7d30b9658349675aa8836bb8d75594e226.png';
import attractionsImage from 'figma:asset/e04fa8d75cf2828287ef82f02beaae9386ee6f52.png';
import buckeeImage from 'figma:asset/612bafe8b8efb25cf01bcb8de2b591148614a2b7.png';

const rotationContent = [
  {
    image: conciergeImage,
    alt: 'Hotel Concierge Services',
    headline: (
      <>
        TRAVEL SMART.<br />
        LIVE <span className="text-[var(--brand-yellow)]">LOCAL</span>.<br />
        SAVE MORE.
      </>
    ),
    caption: (
      <>
        Hotel Concierge Services Available -{' '}
        <a href="#hotel-signup" className="text-[var(--brand-yellow)] hover:underline">
          Sign-up Here <ChevronRight className="inline w-4 h-4" />
        </a>
      </>
    ),
  },
  {
    image: transportationImage,
    alt: 'Transportation Services',
    headline: (
      <>
        NEED A RIDE?<br />
        ARRIVE <span className="text-[var(--brand-yellow)]">SAFE</span>.<br />
        SAVE MORE.
      </>
    ),
    caption: (
      <>
        Transportation Services Available -{' '}
        <a href="#transportation" className="text-[var(--brand-yellow)] hover:underline">
          Need a Ride? <ChevronRight className="inline w-4 h-4" />
        </a>
      </>
    ),
  },
  {
    image: eatsImage,
    alt: 'Dining and Restaurants',
    headline: (
      <>
        HUNGRY?<br />
        <span className="text-[var(--brand-yellow)]">EAT LOCAL</span>.<br />
        SAVE MORE.
      </>
    ),
    caption: (
      <>
        Local Restaurant Partnerships Available -{' '}
        <a href="#restaurants" className="text-[var(--brand-yellow)] hover:underline">
          Explore Dining <ChevronRight className="inline w-4 h-4" />
        </a>
      </>
    ),
  },
  {
    image: attractionsImage,
    alt: 'Local Attractions',
    headline: (
      <>
        BORED?<br />
        <span className="text-[var(--brand-yellow)]">EXPLORE</span> LOCAL.<br />
        SAVE MORE.
      </>
    ),
    caption: (
      <>
        Local Attractions & Experiences Available -{' '}
        <a href="#attractions" className="text-[var(--brand-yellow)] hover:underline">
          Start Exploring <ChevronRight className="inline w-4 h-4" />
        </a>
      </>
    ),
  },
];

export function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % rotationContent.length);
        setIsTransitioning(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const goToSlide = (index: number) => {
    if (index === currentSlide) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-6 py-2 lg:py-4 lg:overflow-hidden lg:h-[calc(100vh-200px)]">
      {/* Category Buttons - Above everything on desktop, at bottom on mobile */}
      <div className="hidden lg:block mb-4">
        <div className="flex flex-wrap gap-10 justify-start">
          <CategoryButton type="travels" isActive={currentSlide === 0} onClick={() => goToSlide(0)} />
          <CategoryButton type="transportation" isActive={currentSlide === 1} onClick={() => goToSlide(1)} />
          <CategoryButton type="eats" isActive={currentSlide === 2} onClick={() => goToSlide(2)} />
          <CategoryButton type="attractions" isActive={currentSlide === 3} onClick={() => goToSlide(3)} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:justify-between gap-4 lg:gap-6 items-start">
        {/* Left Side - Image and Text Content */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 order-1 lg:order-none w-full lg:w-auto">
          {/* Left Column - Concierge Image - Order 1 on mobile */}
          <div
            className="order-1 w-full lg:w-[420px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="rounded-lg overflow-hidden h-64 lg:h-[420px]">
              <div
                className="transition-all duration-600 flex flex-col h-full"
                style={{
                  filter: isTransitioning ? 'blur(8px)' : 'blur(0px)',
                  opacity: isTransitioning ? 0.4 : 1,
                }}
              >
                <div className="flex-1 overflow-hidden">
                  <img
                    src={rotationContent[currentSlide].image}
                    alt={rotationContent[currentSlide].alt}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center center' }}
                  />
                </div>
                <div className="bg-black p-2 lg:p-3 flex-shrink-0">
                  <p className="text-white font-bold text-center lg:text-left text-[10px] lg:text-xs leading-tight whitespace-nowrap overflow-hidden">
                    {rotationContent[currentSlide].caption}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Main Message & CTA - Order 2 on mobile */}
          <div
            className="order-2 w-full lg:w-[420px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="space-y-1 lg:space-y-2">
              <p className="text-[var(--brand-yellow)] text-xs lg:text-sm font-bold tracking-wider text-center lg:text-left">WHAT'S ON YOUR BUCKET LIST?</p>

              <div
                className="transition-all duration-600"
                style={{
                  filter: isTransitioning ? 'blur(8px)' : 'blur(0px)',
                  opacity: isTransitioning ? 0.4 : 1,
                }}
              >
                <h1 className="text-4xl lg:text-5xl font-bold leading-none mb-2 text-center lg:text-left">
                  {rotationContent[currentSlide].headline}
                </h1>
              </div>

              {/* Buckee Mascot Section */}
              <button
                className="flex flex-col lg:flex-row gap-2 lg:gap-1 items-center justify-center lg:justify-start group cursor-pointer hover:opacity-90 transition-opacity w-full text-center lg:text-left"
                onClick={() => window.location.href = '#start-trip'}
              >
                <img src={buckeeImage} alt="Buckee" className="w-20 h-20 lg:w-28 lg:h-28 object-contain" />
                <div className="flex-1">
                  <p className="text-[var(--brand-yellow)] font-semibold mb-1 text-xs lg:text-sm leading-tight group-hover:text-[#cc9410] transition-colors whitespace-nowrap">
                    MEET BUCKEE - YOUR AI TRAVEL ASSISTANT!
                  </p>
                  <p className="text-gray-300 text-[10px] lg:text-xs leading-relaxed">
                    PERSONALIZED ITINERARIES, LOCAL INSIDER TIPS<br className="hidden lg:block" />& SMART SAVINGS - ALL IN ONE CLICK!
                  </p>
                </div>
              </button>

              <a href="https://app.citybucketlist.com" className="inline-block text-center bg-[#FDB913] hover:bg-[#cc9410] text-black hover:text-white px-6 lg:px-8 py-2 lg:py-3 rounded-full text-sm lg:text-base font-semibold transition-colors w-full lg:w-auto">
                Join Now
              </a>
            </div>
          </div>
        </div>

        {/* Category Buttons - Mobile Only - Order 3 */}
        <div className="order-3 lg:hidden w-full">
          <div className="flex flex-wrap gap-2 justify-center">
            <CategoryButton type="travels" isActive={currentSlide === 0} onClick={() => goToSlide(0)} />
            <CategoryButton type="transportation" isActive={currentSlide === 1} onClick={() => goToSlide(1)} />
            <CategoryButton type="eats" isActive={currentSlide === 2} onClick={() => goToSlide(2)} />
            <CategoryButton type="attractions" isActive={currentSlide === 3} onClick={() => goToSlide(3)} />
          </div>
        </div>

        {/* Right Column - Side Widgets - Hidden on mobile */}
        <div className="hidden lg:flex space-y-4 flex-col items-end order-2 lg:order-none">
          {/* CBL Blog Button */}
          <Link to="/blog" className="group relative flex items-center w-full justify-end">
            {/* Golden Circle with Message Bubble Icon */}
            <div className="relative flex-shrink-0 z-10" style={{ width: '100px', height: '100px' }}>
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Golden Circle with black fill */}
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="black"
                  stroke="#FDB913"
                  strokeWidth="3.5"
                />
                {/* Message Bubble Icon - centered */}
                <g transform="translate(50, 50) scale(0.8) translate(-73, -71)">
                  <path
                    d="M49.9,87.54l4.34-8.68s-7.49-6.21-6.3-14.09c1.19-7.88,10.73-14.86,22.99-14.86s24.18,6.81,24.18,16.01-9.71,21.12-33.38,16.52c-5.45,2.21-11.83,5.11-11.83,5.11Z"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#FDB913] transition-colors"
                  />
                  <path
                    d="M75.35,83.96c3.93,2.21,10.41,2.89,14.55.9,5.45,2.21,11.83,5.11,11.83,5.11l-4.34-8.68s5.73-2.05,4.54-9.92c0,0-1.02-5.92-6.81-7.39"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#FDB913] transition-colors"
                  />
                  <circle fill="white" cx="62.56" cy="66.35" r="2.37" className="group-hover:fill-[#FDB913] transition-colors"/>
                  <circle fill="white" cx="72.97" cy="66.35" r="2.37" className="group-hover:fill-[#FDB913] transition-colors"/>
                  <circle fill="white" cx="83.39" cy="66.35" r="2.37" className="group-hover:fill-[#FDB913] transition-colors"/>
                </g>
              </svg>
            </div>

            {/* Text with white border - overlapped with circle */}
            <div className="relative flex-1 px-6 py-8 pl-10 -ml-8 min-h-[100px] flex items-center justify-center">
              <span className="text-white font-semibold text-lg tracking-wide group-hover:text-[#FDB913] transition-colors whitespace-nowrap">CBL BLOG</span>
            </div>
          </Link>

          {/* Directory Button */}
          <button onClick={() => window.open('https://directory.citybucketlist.com/', '_blank', 'noopener,noreferrer')} className="group relative flex items-center w-full">
            {/* Golden Circle with Directory Icon */}
            <div className="relative flex-shrink-0 z-10" style={{ width: '100px', height: '100px' }}>
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Golden Circle with black fill */}
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="black"
                  stroke="#FDB913"
                  strokeWidth="3.5"
                />
                {/* Directory Icon - centered and scaled */}
                <g transform="translate(50, 50) scale(0.7) translate(-74, -72)">
                  <rect
                    x="51.23"
                    y="50.63"
                    width="8.1"
                    height="5.41"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#FDB913] transition-colors"
                  />
                  <rect
                    x="51.23"
                    y="61.46"
                    width="8.1"
                    height="5.41"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#FDB913] transition-colors"
                  />
                  <rect
                    x="51.23"
                    y="72.13"
                    width="8.1"
                    height="5.41"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#FDB913] transition-colors"
                  />
                  <rect
                    x="51.23"
                    y="82.88"
                    width="8.1"
                    height="5.41"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#FDB913] transition-colors"
                  />
                  <circle
                    cx="80.6"
                    cy="66.15"
                    r="3.82"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#FDB913] transition-colors"
                  />
                  <path
                    d="M82.48,69.55s5.21,2.58,5.21,6.67c-3.14,0-4.95,0-4.95,0h-2.98s-3.39,0-6.53,0c0-4.09,5.21-6.67,5.21-6.67"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#FDB913] transition-colors"
                  />
                  <path
                    d="M55.28,88.74v5.18h38.45c2.54,0,2.54-2.54,2.54-2.54v-43.55c0-2.54-2.87-2.65-2.87-2.65h-38.12v4.85"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#FDB913] transition-colors"
                  />
                  <line
                    x1="64.07"
                    y1="49.26"
                    x2="64.07"
                    y2="89.95"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#FDB913] transition-colors"
                  />
                  <line
                    x1="55.28"
                    y1="56.04"
                    x2="55.28"
                    y2="61.46"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#FDB913] transition-colors"
                  />
                  <line
                    x1="55.28"
                    y1="67.26"
                    x2="55.28"
                    y2="71.31"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#FDB913] transition-colors"
                  />
                  <line
                    x1="55.28"
                    y1="78.66"
                    x2="55.28"
                    y2="82.71"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-[#FDB913] transition-colors"
                  />
                </g>
              </svg>
            </div>

            {/* Text with white border - overlapped with circle */}
            <div className="relative flex-1 px-6 py-8 pl-10 -ml-8 min-h-[100px] flex items-center justify-center">
              <span className="text-white font-semibold text-lg tracking-wide group-hover:text-[#FDB913] transition-colors whitespace-nowrap">DIRECTORY</span>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
