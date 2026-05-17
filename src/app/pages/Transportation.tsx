export function Transportation() {
  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-6 py-12 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl lg:text-6xl font-bold leading-none mb-6">
        Need a <span className="text-[#FDB913]">Ride?</span>
      </h1>
      <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
        We're building a network of trusted, independent rideshare drivers to get you where you need to go safely and reliably. 
        Transportation services launching soon!
      </p>
      <button className="bg-[#FDB913] hover:bg-[#cc9410] text-black font-bold px-8 py-3 rounded-full transition-colors">
        LEARN MORE
      </button>
    </main>
  );
}
