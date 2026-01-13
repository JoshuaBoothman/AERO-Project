import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ... imports remain the same

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    async function fetchEvents() {
      try {
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch('/api/events', { headers });

        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [token]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading events...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading events: {error}</div>;

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const now = new Date();
  const current = events.filter(e => new Date(e.start_date) <= now && new Date(e.end_date) >= now);
  const upcoming = events.filter(e => new Date(e.start_date) > now);
  const past = events.filter(e => new Date(e.end_date) < now);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Events</h2>
        {isAdmin && (
          <Link to="/events/new">
            <button className="bg-primary hover:bg-primary/90 text-secondary font-bold py-2 px-6 rounded shadow transition-all">New Event</button>
          </Link>
        )}
      </div>

      {/* CURRENT EVENTS */}
      {current.length > 0 && (
        <section className="mb-12">
          <h3 className="text-xl font-bold text-accent mb-4 uppercase tracking-wider">Happening Now</h3>
          <div className="space-y-6">
            {current.map(event => (
              <EventCard key={event.event_id} event={event} type="current" formatDate={formatDate} isAdmin={isAdmin} />
            ))}
          </div>
        </section>
      )}

      {/* UPCOMING */}
      <section className="mb-12">
        <h3 className="text-2xl font-bold text-gray-700 mb-6">Upcoming Events</h3>
        <div className="space-y-6">
          {upcoming.map(event => (
            <EventCard key={event.event_id} event={event} formatDate={formatDate} isAdmin={isAdmin} />
          ))}
          {upcoming.length === 0 && <p className="text-gray-500 italic">No upcoming events scheduled.</p>}
        </div>
      </section>

      {/* PAST */}
      <section className="mb-12">
        <h3 className="text-2xl font-bold text-gray-700 mb-6">Past Events</h3>
        <div className="space-y-6">
          {past.map(event => (
            <EventCard key={event.event_id} event={event} formatDate={formatDate} isPast isAdmin={isAdmin} />
          ))}
        </div>
      </section>
    </div>
  );
}

function EventCard({ event, type, formatDate, isPast, isAdmin }) {
  const isCurrent = type === 'current';

  return (
    <div className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row ${isPast ? 'opacity-70 grayscale-[50%]' : ''} ${isCurrent ? 'border-l-4 border-accent shadow-md' : 'border border-gray-100'}`}>

      {/* 1. THUMBNAIL IMAGE (Left Side / Top on Mobile) */}
      <div className="w-full h-48 sm:w-64 sm:h-auto bg-gray-100 flex-shrink-0">
        {event.banner_url ? (
          <img src={event.banner_url} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
            No Image
          </div>
        )}
      </div>

      {/* 2. CONTENT (Right Side / Bottom on Mobile) */}
      <div className="p-6 flex-1 flex flex-col justify-center">

        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-bold text-gray-800 m-0">{event.name}</h3>
            {isCurrent && (
              <span className="bg-accent text-primary px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                Active
              </span>
            )}
          </div>
        </div>

        <p className="text-sm font-medium text-gray-500 mb-3">
          {formatDate(event.start_date)} - {formatDate(event.end_date)}
        </p>

        <p className="text-gray-600 mb-6 whitespace-pre-wrap line-clamp-3">{event.description}</p>

        <div className="mt-auto">
          <Link to={isAdmin ? `/events/${event.slug}/edit` : `/events/${event.slug}`}>
            <button className={`font-bold py-2 px-4 rounded transition-colors text-sm uppercase tracking-wide
                ${isCurrent
                ? 'bg-primary text-secondary hover:bg-black/80'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}>
              {isAdmin ? 'Edit Details' : (isPast ? 'View Recap' : 'View Details')}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Events;