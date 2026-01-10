import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        const response = await fetch('/api/getEvents', { headers });

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

  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error loading events: {error}</div>;

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const now = new Date();
  const current = events.filter(e => new Date(e.start_date) <= now && new Date(e.end_date) >= now);
  const upcoming = events.filter(e => new Date(e.start_date) > now);
  const past = events.filter(e => new Date(e.end_date) < now);

  return (
    <div className="events-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Events</h2>
        {isAdmin && (
          <Link to="/events/new">
            <button className="primary-button">New Event</button>
          </Link>
        )}
      </div>

      {/* CURRENT EVENTS */}
      {current.length > 0 && (
        <section className="event-section current">
          <h3>HAPPENING NOW</h3>
          <div className="event-grid">
            {current.map(event => (
              <EventCard key={event.event_id} event={event} type="current" formatDate={formatDate} isAdmin={isAdmin} />
            ))}
          </div>
        </section>
      )}

      {/* UPCOMING */}
      <section className="event-section">
        <h3>Upcoming Events</h3>
        <div className="event-grid">
          {upcoming.map(event => (
            <EventCard key={event.event_id} event={event} formatDate={formatDate} isAdmin={isAdmin} />
          ))}
          {upcoming.length === 0 && <p>No upcoming events scheduled.</p>}
        </div>
      </section>

      {/* PAST */}
      <section className="event-section">
        <h3>Past Events</h3>
        <div className="event-grid">
          {past.map(event => (
            <EventCard key={event.event_id} event={event} formatDate={formatDate} isPast isAdmin={isAdmin} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ... imports and Event function remain the same ...

function EventCard({ event, type, formatDate, isPast, isAdmin }) {
  const isCurrent = type === 'current';

  // Card Container
  const cardStyle = {
    opacity: isPast ? 0.7 : 1,
    marginBottom: '1rem',
    borderLeft: isCurrent ? '5px solid var(--accent-color, #FFD700)' : '1px solid transparent', // Changed default to transparent
    boxShadow: isCurrent ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
    display: 'flex',       // <--- Flexbox for Image + Content side-by-side
    flexDirection: 'row',  // Row direction
    overflow: 'hidden',    // Ensures image respects rounded corners
    padding: 0,            // Reset padding so image touches edge
  };

  const imageStyle = {
    width: '200px',        // Fixed width for thumbnail
    objectFit: 'cover',    // Ensures image covers area without stretching
    display: 'block'       // Removes bottom whitespace
  };

  const contentStyle = {
    padding: '1.5rem',     // Re-add padding to the content side
    flex: 1,               // Take up remaining space
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  };

  const badgeStyle = {
    background: 'var(--accent-color, #FFD700)',
    color: 'var(--primary-color, #000000)',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    alignSelf: 'flex-start' // Don't stretch
  };

  return (
    <div className="card event-card" style={cardStyle}>

      {/* 1. THUMBNAIL IMAGE (Left Side) */}
      {event.banner_url ? (
        <img src={event.banner_url} alt={event.name} style={imageStyle} />
      ) : (
        // Fallback grey box if no image
        <div style={{ ...imageStyle, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
          No Image
        </div>
      )}

      {/* 2. CONTENT (Right Side) */}
      <div style={contentStyle}>

        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0 }}>{event.name}</h3>
          {isCurrent && <span style={badgeStyle}>ACTIVE</span>}
        </div>

        <p className="event-date" style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
          {formatDate(event.start_date)} - {formatDate(event.end_date)}
        </p>

        <p style={{ margin: '0 0 1rem 0' }}>{event.description}</p>

        <div style={{ marginTop: 'auto' }}>
          <Link to={isAdmin ? `/events/${event.slug}/edit` : `/events/${event.slug}`}>
            {/* Apply styling to ALL buttons now */}
            <button className={isCurrent ? 'primary-button' : 'secondary-button'}>
              {isAdmin ? 'Edit Details' : (isPast ? 'View Recap' : 'View Details')}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
// ... export default

export default Events;