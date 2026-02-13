import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetch('/api/gallery')
      .then(res => res.json())
      .then(data => setGalleryItems(data || []))
      .catch(err => console.error('Error fetching gallery:', err));
  }, []);

  useEffect(() => {
    if (galleryItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % galleryItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [galleryItems.length]);
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero / Banner Section */}
      <section className="relative overflow-hidden bg-black group">
        <img
          src="/hero-banner.webp"
          alt="ALSM Festival of Aeromodelling 2026"
          className="w-full h-auto block min-h-[200px] object-cover md:object-contain"
        />

        {/* Action Buttons - Positioned over the black bar in the image */}
        <div className="absolute bottom-0 left-0 right-0 py-2 md:py-4 lg:py-6 flex items-center justify-center gap-3 md:gap-6 bg-gradient-to-t from-black/80 to-transparent md:from-transparent">
          <Link
            to="/events"
            className="px-4 py-1.5 md:px-8 md:py-3 bg-[var(--accent-color)] text-[var(--primary-color)] font-bold rounded-lg text-xs md:text-base lg:text-lg hover:brightness-110 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            View Events
          </Link>
          <Link
            to="/shop"
            className="px-4 py-1.5 md:px-8 md:py-3 bg-white text-[var(--primary-color)] md:bg-white/10 md:backdrop-blur-sm md:border md:border-white/30 md:text-white font-bold rounded-lg text-xs md:text-base lg:text-lg hover:bg-white/20 transition-all shadow-lg transform hover:-translate-y-1"
          >
            Register Now
          </Link>
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
              {/* Image Gallery Carousel */}
              <div className="aspect-video bg-gray-200 rounded-xl shadow-lg relative overflow-hidden group">
                {galleryItems.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gray-300 animate-pulse"></div>
                    <span className="relative z-10 text-gray-500 font-medium italic">Gallery is empty</span>
                  </div>
                ) : (
                  <>
                    {galleryItems.map((item, index) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out cursor-pointer hover:brightness-95 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                          }`}
                      >
                        {item.media_type === 'video' ? (
                          <video
                            src={item.url}
                            className="w-full h-full object-contain"
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={item.caption || 'Event Highlight'}
                            className="w-full h-full object-contain"
                          />
                        )}
                        {item.caption && (
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white text-sm">
                            {item.caption}
                          </div>
                        )}
                      </a>
                    ))}

                    {/* Navigation Dots */}
                    {galleryItems.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
                        {galleryItems.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? 'bg-white w-4' : 'bg-white/50'
                              }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
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

          <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* National */}
            <AssociationLink
              name="MAAA"
              href="https://www.maaa.asn.au/"
              isNational
              logo="/logos/MAA.webp"
            />

            {/* States */}
            <AssociationLink name="MAAQ (QLD)" href="https://maaq.org/" logo="/logos/MAAQ.webp" />
            <AssociationLink name="ANSW (NSW)" href="https://nsw.aeromodellers.org.au/" logo="/logos/ANSW.webp" />
            <AssociationLink name="ACTAA (ACT)" href="https://actaa.net.au/" logo="/logos/ASCTAA.webp" />
            <AssociationLink name="MASA (SA)" href="https://www.masa.org.au/" logo="/logos/MASA.webp" />
            <AssociationLink name="ANT (NT)" href="https://www.maaa.asn.au/about-us/state-associations/ant" logo="/logos/ANT.webp" />
            <AssociationLink name="TMAA (TAS)" href="https://tasmodelaero.com/" logo="/logos/TMAA.webp" />
            <AssociationLink name="VMAA (VIC)" href="https://www.vmaa.com.au/" logo="/logos/VMAA.webp" />
            <AssociationLink name="AWA (WA)" href="https://www.facebook.com/profile.php?id=100064786877751" logo="/logos/AWA.webp" />
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
            <a
              href="https://www.grc.qld.gov.au/Home"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-[var(--primary-color)]"
            >
              <img
                src="/logos/goondoowindi-council-logo.webp"
                alt="Goondiwindi Regional Council Logo"
                className="h-12 md:h-16 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Component for Association Links
function AssociationLink({ name, href, isNational, logo }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-300 group
        w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.33%-2rem)] lg:w-[calc(20%-2rem)] min-w-[160px]
        bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:scale-105 hover:border-[var(--primary-color)]
      `}
    >
      <div className={`w-20 h-20 mb-4 flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500`}>
        {logo ? (
          <img
            src={logo}
            alt={`${name} Logo`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${isNational ? 'bg-white/20' : 'bg-gray-200'}`}>
            {name.charAt(0)}
          </div>
        )}
      </div>
      <span className="font-bold text-sm md:text-base text-center">{name}</span>
    </a>
  );
}

export default Home;