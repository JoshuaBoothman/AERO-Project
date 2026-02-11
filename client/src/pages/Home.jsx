import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero / Banner Section */}
      <section className="relative bg-gray-900 text-white py-24 px-4 md:py-32 overflow-hidden">
        {/* Placeholder Background - In production this would be an <img> or background-image */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-color)] to-gray-900 opacity-90 z-0"></div>
        <div className="absolute inset-0 bg-[url('/placeholder-hero.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay z-0"></div>

        <div className="container mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            Australian Large Scale Models invites you to the <br className="hidden md:block" />
            <span className="text-[var(--accent-color)]">Festival of Aeromodelling 2026</span>
          </h1>
          <p className="text-xl md:text-3xl font-light mb-8 text-gray-200">
            4th – 12th of July 2026<br />
            <span className="font-semibold">Inglewood Aerodrome</span>
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/events"
              className="px-8 py-3 bg-[var(--accent-color)] text-[var(--primary-color)] font-bold rounded-lg text-lg hover:brightness-110 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              View Events
            </Link>
            <Link
              to="/shop"
              className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-bold rounded-lg text-lg hover:bg-white/20 transition-all"
            >
              Register Now
            </Link>
          </div>
        </div>
      </section>

      {/* 2. About ALSM Section */}
      <section className="py-16 md:py-24 bg-white px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-[var(--primary-color)] relative inline-block">
            About ALSM
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[var(--accent-color)] rounded-full mb-[-10px]"></span>
          </h2>

          <div className="space-y-8 text-lg text-gray-700 leading-relaxed text-left md:text-justify">
            <p>
              Australian Large Scale Models (ALSM) began as a simple Facebook group, created by an individual with a passion for large scale model aircraft and a desire to share that passion with others. What started as a small online community has grown over more than a decade into one of the largest and most active aeromodelling groups in the world, now boasting over 16,200 members.
            </p>
            <p>
              In 2020, ALSM took the next step by hosting its first large scale flying event at Tin Can Bay. The success of that inaugural gathering laid the foundation for something much bigger. Since 2022, ALSM has proudly hosted the Festival of Aeromodelling annually in Inglewood, Queensland, each July.
            </p>
            <p>
              Today, the Festival of Aeromodelling is Australia’s largest RC aeromodelling event, attracting pilots and enthusiasts from across Australia and overseas. ALSM continues to celebrate craftsmanship, scale realism, and the shared love of flight that brings the aeromodelling community together.
            </p>
          </div>
        </div>
      </section>

      {/* 3. ALSM's Premier Event Section */}
      <section className="py-16 md:py-24 bg-gray-50 px-4 border-t border-gray-200">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2">
              {/* Placeholder for Event Image */}
              <div className="aspect-video bg-gray-200 rounded-xl shadow-lg flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gray-300 animate-pulse"></div>
                <span className="relative z-10 text-gray-500 font-medium">Event Highlights Video/Image</span>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[var(--primary-color)]">
                ALSM's Premier Event
              </h2>
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                <p>
                  The Vision of the Festival of Aeromodelling started with members of the Australian Large Scale Models fulfilling the dream to be able to attend the World’s Largest RC Fun Fly, Joe Nall in the state of South Carolina, USA.
                </p>
                <p>
                  It was from attending such an event that a group of like-minded Australian Aeromodellers came together to help recreate the equivalent for the Australian Aeromodelling Community, to which the Festival of Aeromodelling was born.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. National & State Associations Section */}
      <section className="py-16 md:py-24 bg-white px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[var(--primary-color)]">
            National & State Associations
          </h2>
          <p className="max-w-3xl mx-auto text-lg text-gray-600 mb-12">
            Can’t make it to an Australian Large Scale Models event, or new to aeromodelling? You can find local flying events and information on how to get into the hobby through the Model Aeronautical Association of Australia or via your state association below.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
            {/* National */}
            <AssociationLink name="MAAA" href="https://www.maaa.asn.au/" isNational />

            {/* States */}
            <AssociationLink name="MAAQ (QLD)" href="https://maaq.org/" />
            <AssociationLink name="ANSW (NSW)" href="https://nsw.aeromodellers.org.au/" />
            <AssociationLink name="ACTAA (ACT)" href="https://actaa.net.au/" />
            <AssociationLink name="MASA (SA)" href="https://www.masa.org.au/" />
            <AssociationLink name="ANT (NT)" href="https://www.maaa.asn.au/about-us/state-associations/ant" />
            <AssociationLink name="TMAA (TAS)" href="https://tasmodelaero.com/" />
            <AssociationLink name="VMAA (VIC)" href="https://www.vmaa.com.au/" />
            <AssociationLink name="AWA (WA)" href="https://www.facebook.com/profile.php?id=100064786877751" />
          </div>
        </div>
      </section>

      {/* 5. Footer / Thank You Section */}
      <footer className="bg-gray-100 py-12 px-4 border-t border-gray-200">
        <div className="container mx-auto text-center">
          <p className="text-xl text-gray-700 font-medium mb-6">
            We would like to say thank you to the Goondiwindi Regional Council for their ongoing support with Australian Large Scale Models.
          </p>
          <div className="flex justify-center items-center">
            {/* Placeholder for Council Logo */}
            <div className="h-16 w-64 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm font-semibold border-2 border-dashed border-gray-300">
              Goondiwindi Regional Council Logo
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Component for Association Links
function AssociationLink({ name, href, isNational }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-300
        ${isNational
          ? 'bg-[var(--primary-color)] text-white shadow-lg hover:shadow-xl hover:scale-105 col-span-2 md:col-span-1'
          : 'bg-gray-50 text-gray-700 hover:bg-white hover:shadow-md hover:text-[var(--primary-color)] border border-gray-100'}
      `}
    >
      {/* Placeholder Icon/Logo */}
      <div className={`w-12 h-12 mb-3 rounded-full flex items-center justify-center text-xl font-bold ${isNational ? 'bg-white/20' : 'bg-gray-200'}`}>
        {name.charAt(0)}
      </div>
      <span className="font-bold text-sm md:text-base">{name}</span>
    </a>
  );
}

export default Home;