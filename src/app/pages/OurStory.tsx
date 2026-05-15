import buckeeConcierge from 'figma:asset/612bafe8b8efb25cf01bcb8de2b591148614a2b7.png';

export function OurStory() {
  return (
    <main className="max-w-4xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold leading-none mb-2 text-center">
          Our Story
        </h1>
        <p className="text-[#FDB913] text-lg max-w-2xl mx-auto font-semibold">
          Locals everywhere helping new friends from anywhere feel at home.
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-12">
        {/* Section 1: How It All Started */}
        <section className="bg-black rounded-[24px_0_24px_0] overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1600320254374-ce2d293c324e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaWRlc2hhcmUlMjBjYXIlMjBkcml2ZXJ8ZW58MXx8fHwxNzc2MTE0Mzc5fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Rideshare driver"
                className="w-full h-full object-cover min-h-[300px] rounded-[24px_0_24px_0]"
              />
            </div>
            <div className="lg:w-1/2 p-8">
              <h2 className="text-4xl lg:text-5xl font-bold leading-none mb-2 text-center lg:text-left">
                How It All Started
              </h2>
              <p className="text-gray-300 leading-relaxed">
                City Bucket List started with a simple idea: locals everywhere helping new friends from anywhere feel at home.
                What began as a community-driven transportation platform has evolved into something much bigger — a full lifestyle
                and local discovery membership built for every city.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: What We Do */}
        <section className="bg-black rounded-[24px_0_24px_0] overflow-hidden">
          <div className="flex flex-col lg:flex-row-reverse">
            <div className="lg:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1766812782166-e243111f703d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwZGluaW5nJTIwZXhwZXJpZW5jZXxlbnwxfHx8fDE3NzYxMTQzNzl8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Restaurant dining experience"
                className="w-full h-full object-cover min-h-[300px] rounded-[24px_0_24px_0]"
              />
            </div>
            <div className="lg:w-1/2 p-8">
              <h2 className="text-4xl lg:text-5xl font-bold leading-none mb-2 text-center lg:text-left">
                What We Do
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                City Bucket List connects members with authentic local experiences across four key categories: transportation,
                dining, attractions, and travel services. Whether you need a safe ride from a trusted independent driver, want
                to discover the best local restaurants, or are looking for hidden attractions that only locals know about, our
                membership platform brings it all together.
              </p>
              <p className="text-gray-300 leading-relaxed">
                We partner with independent contractors, local businesses, and community experts to create a curated directory
                of services and experiences that help you live like a local in any city you visit.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Exciting News */}
        <section className="bg-black rounded-[24px_0_24px_0] p-8">
          <h2 className="text-4xl lg:text-5xl font-bold leading-none mb-2 text-left lg:ml-24">
            Exciting News
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <img src={buckeeConcierge} alt="Buckee" className="w-20 h-20 object-contain flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-[#FDB913] font-bold text-lg mb-2">Meet Buckee - Your AI Travel Assistant</h3>
                <p className="text-gray-300 leading-relaxed">
                  We're launching Buckee, an AI-powered travel companion that creates personalized itineraries based on your
                  preferences, connects you with local insiders, and helps you discover experiences tailored just for you.
                  Think of it as having a local friend in every city, available 24/7.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-20 h-20 flex-shrink-0 bg-[#0a0a0a] rounded-xl flex items-center justify-center p-3">
              <svg viewBox="682 100 83 90" className="w-full h-full">
                <circle cx="735.03" cy="138.87" r="6.35" fill="none" stroke="white" strokeWidth="3.98" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M738.15,144.53s8.66,4.29,8.66,11.09c-5.22,0-8.23,0-8.23,0h-4.95s-5.64,0-10.86,0c0-6.8,8.66-11.09,8.66-11.09" fill="none" stroke="white" strokeWidth="3.98" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M692.94,176.42v8.62h63.93c4.22,0,4.22-4.22,4.22-4.22v-72.41c0-4.22-4.77-4.4-4.77-4.4h-63.38v8.07" fill="none" stroke="white" strokeWidth="3.98" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="707.56" x2="707.56" y1="110.8" y2="178.44" stroke="white" strokeWidth="3.98" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="692.94" x2="692.94" y1="122.07" y2="131.08" stroke="white" strokeWidth="3.98" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="692.94" x2="692.94" y1="140.71" y2="147.46" stroke="white" strokeWidth="3.98" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="692.94" x2="692.94" y1="159.67" y2="166.41" stroke="white" strokeWidth="3.98" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="686.2" y="113.07" width="13.47" height="9" fill="none" stroke="white" strokeWidth="3.98" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="686.2" y="131.08" width="13.47" height="9" fill="none" stroke="white" strokeWidth="3.98" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="686.2" y="148.81" width="13.47" height="9" fill="none" stroke="white" strokeWidth="3.98" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="686.2" y="166.69" width="13.47" height="9" fill="none" stroke="white" strokeWidth="3.98" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
              <div className="flex-1">
                <h3 className="text-[#FDB913] font-bold text-lg mb-2">Expanding Our Directory</h3>
                <p className="text-gray-300 leading-relaxed">
                  We're rapidly growing our network of verified independent contractors and local businesses. From boutique
                  hotels to family-owned restaurants, from local tour guides to trusted transportation providers — our directory
                  is becoming the most comprehensive resource for authentic local experiences.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-20 h-20 flex-shrink-0 bg-[#0a0a0a] rounded-xl flex items-center justify-center p-1">
              <svg viewBox="0 0 125 24" className="w-full h-auto" fill="none" role="presentation">
                <path clipRule="evenodd" fillRule="evenodd" fill="#FF690F" d="M0 24h23.936V0H0v24zm25.266 0h23.936V0H25.266v24zm49.202 0H50.532V0h23.936v24zm1.33 0h23.936V0H75.798v24zM125 24h-23.936V0H125v24z"/>
                <path clipRule="evenodd" fillRule="evenodd" fill="#FAFAFC" d="M10.287 11.549V6H7.38v12h2.907v-5.548L13.348 18h3.208l-3.33-6 3.33-6h-3.208l-3.061 5.549zm24.785 4.724L34.552 18h-3.104l3.947-12h3.696l3.93 12h-3.194l-.52-1.727h-4.235zm2.117-6.837l-1.4 4.48h2.8l-1.4-4.48zM63.98 18h-2.906v-5.29L57.144 6h3.463l1.938 3.688L64.447 6h3.409l-3.876 6.71V18zm21.624-1.727L85.084 18h-3.105l3.948-12h3.696l3.93 12h-3.194l-.52-1.727h-4.235zm2.117-6.837l-1.4 4.48h2.8l-1.4-4.48zm23.63 2.113V6h-2.907v12h2.907v-5.548L114.412 18h3.208l-3.33-6 3.33-6h-3.208l-3.061 5.549z"/>
              </svg>
            </div>
              <div className="flex-1">
                <h3 className="text-[#FDB913] font-bold text-lg mb-2">Growing Strategic Partnerships</h3>
                <p className="text-gray-300 leading-relaxed">
                  We're partnering with hotels, tourism boards, and travel platforms to bring the City Bucket List experience
                  to more cities worldwide. Our vision is to create a global community where every traveler can access local
                  expertise and every local can share their city with the world.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-16">
        <p className="text-gray-400 mb-6">
          Ready to start your journey with us?
        </p>
        <button className="bg-[#FDB913] hover:bg-[#FDB913] text-black font-bold px-8 py-3 rounded-full transition-colors">
          JOIN CITY BUCKET LIST
        </button>
      </div>
    </main>
  );
}
