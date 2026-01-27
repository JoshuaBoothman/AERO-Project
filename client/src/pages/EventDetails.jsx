import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import CampsiteModal from '../components/CampsiteModal';
import PublicRegistrationModal from '../components/Public/PublicRegistrationModal';

function EventDetails({ propSlug }) {
    const { slug: paramSlug } = useParams();
    const slug = propSlug || paramSlug;
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { notify } = useNotification();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Purchase State (Legacy - Moved to StorePage.jsx)
    // Only Public Registration Modal kept here
    const [showPublicModal, setShowPublicModal] = useState(false);
    const [selectedPublicDay, setSelectedPublicDay] = useState(null);

    // Products Map Cache (Still used? If tickets are displayed for info only, maybe. 
    // But tickets are usually hidden if we don't want people buying here. 
    // The user said "This is the main "brochure" style page".
    // Let's remove tickets state if it's not needed for Public Reg, 
    // BUT the page might list tickets for information? 
    // Code inspection says it renders tickets in a modal 'showTicketModal'.
    // If we remove that modal, we don't need tickets state for that purpose.
    // We'll keep 'event' and 'loading' obviously.

    useEffect(() => {
        async function fetchEvent() {
            try {
                // Cache: no-store to ensure updates (e.g. description changes) appear immediately
                const response = await fetch(`/api/events/${slug}`, { cache: 'no-store' });
                if (response.status === 404) throw new Error('Event not found');
                const data = await response.json();

                // We just need the event data. Tickets are for the Store.
                if (data.tickets) {
                    const { tickets, ...eventData } = data;
                    setEvent(eventData);
                } else {
                    setEvent(data);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchEvent();
    }, [slug]);

    // Removed: My Pilots Fetch (Only needed for purchasing/managing)
    // Removed: Linked Products Fetch (Only needed for purchasing)
    // Removed: Cart/Checkout Handlers

    if (loading) return <div className="container">Loading...</div>;
    if (error) return <div className="container error">{error}</div>;
    if (!event) return <div className="container">Event not found</div>;

    return (
        <div className="container mx-auto px-4 py-6">
            {event.banner_url && (
                <div className="w-full h-48 md:h-[350px] rounded-xl overflow-hidden mb-8 shadow-md bg-gray-200">
                    <img
                        src={event.banner_url}
                        alt={event.name}
                        className="w-full h-full object-cover object-center"
                    />
                </div>
            )}

            <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-3xl md:text-5xl font-bold my-6 text-gray-900">{event.name}</h1>
                <p className="whitespace-pre-wrap mb-8 text-gray-700 leading-relaxed text-lg text-left md:text-center">{event.description}</p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    {/* Links to Store if logged in? Or just rely on Nav. */}
                    {/* Maybe a "Buy Tickets" button that goes to the store? user didn't ask, but it's helpful. */}
                    {/* For now, just removing the dead buttons as requested. */}
                </div>

                {/* Public Event Days Section */}
                {event.public_days && event.public_days.length > 0 && (
                    <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-left">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Air Show Registration (Public Attendance)</h2>
                                <p className="text-gray-600">Register your attendance for the public air show days. It's free!</p>
                            </div>
                        </div>

                        <div className="grid gap-4 mt-6">
                            {event.public_days.map(day => (
                                <div key={day.id} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors bg-blue-50/30">
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-[#0f172a]">{day.title}</h3>
                                            <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                                <span>
                                                    📅 {new Date(day.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                                {day.start_time && (
                                                    <span>
                                                        ⏰ {day.start_time.substring(0, 5)} - {day.end_time?.substring(0, 5)}
                                                    </span>
                                                )}
                                            </div>
                                            {day.description && <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">{day.description}</p>}
                                        </div>
                                        <div className="self-start">
                                            <button
                                                onClick={() => {
                                                    setSelectedPublicDay(day);
                                                    setShowPublicModal(true);
                                                }}
                                                className="bg-[#0f172a] text-white hover:bg-[#1e293b] font-medium py-2 px-6 rounded-lg transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
                                            >
                                                Register for Air Show
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Public Registration Modal */}
                <PublicRegistrationModal
                    isOpen={showPublicModal}
                    onClose={() => setShowPublicModal(false)}
                    publicDay={selectedPublicDay}
                />


            </div>
        </div>
    );
}

export default EventDetails;