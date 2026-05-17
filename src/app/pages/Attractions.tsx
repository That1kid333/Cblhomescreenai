export function Attractions() {
  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-6 py-12 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl lg:text-6xl font-bold leading-none mb-6">
        Local <span className="text-[#FDB913]">Attractions</span>
      </h1>
      <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
        Discover hidden gems and must-see landmarks in your city. 
        Our curated list of local experiences and attractions is coming soon!
      </p>
      <button className="bg-[#FDB913] hover:bg-[#cc9410] text-black font-bold px-8 py-3 rounded-full transition-colors">
        STAY TUNED
      </button>
    </main>
  );
}
