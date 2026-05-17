import riderImage from '../../assets/rider_meeting_driver_neutral.png';
import driverImage from '../../assets/driver_holding_phone_neutral.png';

export function HowItWorks() {
  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
      {/* Hero */}
      <section className="text-center mb-16 lg:mb-24">
        <span className="inline-block bg-[#FDB913] text-black text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full mb-6">
          Private Membership Association
        </span>
        <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6 text-white">
          Scheduled rides.
          <br />
          <span className="text-[#FDB913]">
            Drivers you know.
          </span>
        </h1>
        <p className="text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed mb-8">
          City Bucket List isn't on-demand. It's a private
          membership for scheduled rides — where drivers build
          their own network of riders, and riders ride with
          someone they've already met. Need a quick one-off? Use
          whatever rideshare you like. We're not here to replace
          on-demand apps. We're here to give drivers a network
          of their own.
        </p>
        <button className="bg-[#FDB913] hover:bg-[#e6a511] text-black font-bold px-8 py-3 rounded-full transition-colors">
          Find a CBL Driver
        </button>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12 pt-8 border-t border-white/10 max-w-4xl mx-auto">
          <div>
            <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">
              Ride Type
            </div>
            <div className="text-[#FDB913] text-xl font-bold">
              Scheduled
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">
              Structure
            </div>
            <div className="text-[#FDB913] text-xl font-bold">
              Membership
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">
              Drivers Keep
            </div>
            <div className="text-[#FDB913] text-xl font-bold">
              Full Fare
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">
              Riders Stay
            </div>
            <div className="text-[#FDB913] text-xl font-bold">
              Free to Choose
            </div>
          </div>
        </div>
      </section>

      {/* Choice band */}
      <section className="bg-black rounded-[24px_0_24px_0] p-8 mb-16 lg:mb-24 border border-white/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="text-[#FDB913] text-4xl leading-none">
            ✦
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-lg mb-1">
              Freedom to Choose
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              CBL is one option in your ride mix. Keep your
              on-demand apps, robotaxis, taxis, or transit — use
              whatever fits the trip. We just give drivers a way
              to run their own private rides.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="border border-white/20 text-gray-300 text-xs px-3 py-1 rounded-full">
              + Rideshare apps
            </span>
            <span className="border border-white/20 text-gray-300 text-xs px-3 py-1 rounded-full">
              + Robotaxis
            </span>
            <span className="border border-white/20 text-gray-300 text-xs px-3 py-1 rounded-full">
              + Taxis
            </span>
            <span className="border border-white/20 text-gray-300 text-xs px-3 py-1 rounded-full">
              + Transit
            </span>
          </div>
        </div>
      </section>

      {/* Row: Riders */}
      <section className="mb-16 lg:mb-24">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/2 relative">
            <div className="absolute -top-4 -left-4 bg-[#FDB913] text-black text-xl font-bold rounded-full w-14 h-14 flex items-center justify-center z-10">
              01
            </div>
            <img
              src={riderImage}
              alt="Rider in back seat"
              className="w-full object-cover rounded-[24px_0_24px_0]"
              style={{ maxHeight: "420px" }}
            />
          </div>
          <div className="lg:w-1/2">
            <span className="text-[#FDB913] text-xs uppercase tracking-widest font-bold">
              For Riders
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mt-2 mb-4 text-white leading-tight">
              Ride with a driver{" "}
              <span className="text-[#FDB913]">
                you've already met.
              </span>
            </h2>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              CBL rides are scheduled, private, and arranged
              directly with a driver you know. Every CBL rider
              was invited by their driver — in person, in the
              car, via QR code.
            </p>
            <div className="bg-black border-l-4 border-[#FDB913] p-4 mb-6 rounded-r-lg">
              <p className="text-gray-200 text-sm leading-relaxed">
                <span className="font-bold text-[#FDB913]">
                  How membership works today →
                </span>{" "}
                You become a CBL rider when a driver invites
                you. Scan their QR code, sign up as a Private
                Membership Association member, and you're set to
                schedule rides with that driver going forward.
              </p>
            </div>
            <ol className="space-y-3 mb-6">
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span className="text-gray-300">
                  Meet a CBL driver in person — in their car
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span className="text-gray-300">
                  Scan their QR code to sign up as a PMA member
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <span className="text-gray-300">
                  Schedule rides with your driver, on your time
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </span>
                <span className="text-gray-300">
                  Use any on-demand rideshare for one-off trips
                </span>
              </li>
            </ol>
            <div className="flex flex-wrap gap-3">
              <button className="bg-[#FDB913] hover:bg-[#e6a511] text-black font-bold px-6 py-2 rounded-full transition-colors">
                Learn About Membership
              </button>
              <button className="border border-[#FDB913] text-[#FDB913] hover:bg-[#FDB913] hover:text-black font-bold px-6 py-2 rounded-full transition-colors">
                How to Find a Driver
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Row: Drivers (reversed) */}
      <section className="mb-16 lg:mb-24">
        <div className="flex flex-col lg:flex-row-reverse gap-12 items-center">
          <div className="lg:w-1/2 relative">
            <div className="absolute -top-4 -left-4 bg-[#FDB913] text-black text-xl font-bold rounded-full w-14 h-14 flex items-center justify-center z-10">
              02
            </div>
            <img
              src={driverImage}
              alt="Independent driver at the wheel"
              className="w-full object-cover rounded-[24px_0_24px_0]"
              style={{ maxHeight: "420px" }}
            />
          </div>
          <div className="lg:w-1/2">
            <span className="text-[#FDB913] text-xs uppercase tracking-widest font-bold">
              For Independent Drivers
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mt-2 mb-4 text-white leading-tight">
              Build{" "}
              <span className="text-[#FDB913]">your own</span>{" "}
              rider network.
            </h2>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              CBL gives you the tools to bring your own riders
              on board and run scheduled, private rides — not
              ping-ponging strangers across town. You keep your
              full fare. Your riders stay with you.
            </p>
            <div className="bg-black border-l-4 border-[#FDB913] p-4 mb-6 rounded-r-lg">
              <p className="text-gray-200 text-sm leading-relaxed">
                <span className="font-bold text-[#FDB913]">
                  Why the QR code →
                </span>{" "}
                Every driver gets a sign-up QR code. You invite
                riders in your car, they scan, they join your
                network. From there, they schedule rides
                directly with you through the CBL Private
                Membership Association.
              </p>
            </div>
            <ol className="space-y-3 mb-6">
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span className="text-gray-300">
                  Apply to drive with CBL
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span className="text-gray-300">
                  Pass background & vehicle checks
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <span className="text-gray-300">
                  Get your CBL driver kit + personal QR code
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </span>
                <span className="text-gray-300">
                  Invite riders to sign up — right from your car
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  5
                </span>
                <span className="text-gray-300">
                  Schedule private rides with your members
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  6
                </span>
                <span className="text-gray-300">
                  Keep your full fare — no CBL commission
                </span>
              </li>
            </ol>
            <div className="flex flex-wrap gap-3">
              <button className="bg-[#FDB913] hover:bg-[#e6a511] text-black font-bold px-6 py-2 rounded-full transition-colors">
                Start Driving
              </button>
              <button className="border border-[#FDB913] text-[#FDB913] hover:bg-[#FDB913] hover:text-black font-bold px-6 py-2 rounded-full transition-colors">
                Driver FAQ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Row: Concierge */}
      <section className="mb-16 lg:mb-24">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/2 relative">
            <div className="absolute -top-4 -left-4 bg-[#FDB913] text-black text-xl font-bold rounded-full w-14 h-14 flex items-center justify-center z-10">
              03
            </div>
            <img
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900"
              alt="Concierge partner"
              className="w-full object-cover rounded-[24px_0_24px_0]"
              style={{ maxHeight: "420px" }}
            />
          </div>
          <div className="lg:w-1/2">
            <span className="text-[#FDB913] text-xs uppercase tracking-widest font-bold">
              For Concierge Partners
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mt-2 mb-4 text-white leading-tight">
              Help drivers{" "}
              <span className="text-[#FDB913]">
                grow their network.
              </span>
            </h2>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              Concierge Partners are the local backbone —
              hotels, senior communities, venues, small
              businesses — that connect riders to CBL drivers
              who fit their needs. When your referrals sign up,
              drivers earn, riders get a trusted ride, and you
              share in every trip that follows.
            </p>
            <div className="bg-black border-l-4 border-[#FDB913] p-4 mb-6 rounded-r-lg">
              <p className="text-gray-200 text-sm leading-relaxed">
                <span className="font-bold text-[#FDB913]">
                  Your role →
                </span>{" "}
                You're the bridge. You know who in your
                community needs reliable, scheduled rides — and
                you introduce them to a CBL driver who can serve
                them for the long haul.
              </p>
            </div>
            <ol className="space-y-3 mb-6">
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span className="text-gray-300">
                  Apply as a concierge partner
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span className="text-gray-300">
                  Complete short onboarding
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <span className="text-gray-300">
                  Match your customers with a CBL driver
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </span>
                <span className="text-gray-300">
                  Drivers onboard them via QR code sign-up
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-[#FDB913] text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  5
                </span>
                <span className="text-gray-300">
                  Earn a share on every ride from your referrals
                </span>
              </li>
            </ol>
            <div className="flex flex-wrap gap-3">
              <button className="bg-[#FDB913] hover:bg-[#e6a511] text-black font-bold px-6 py-2 rounded-full transition-colors">
                Become a Partner
              </button>
              <button className="border border-[#FDB913] text-[#FDB913] hover:bg-[#FDB913] hover:text-black font-bold px-6 py-2 rounded-full transition-colors">
                Partner Benefits
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}