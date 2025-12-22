import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/getEvents');
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
  }, []);

  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error loading events: {error}</div>;

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const now = new Date();
  const current = events.filter(e => new Date(e.start_date) <= now && new Date(e.end_date) >= now);
  const upcoming = events.filter(e => new Date(e.start_date) > now);
  const past = events.filter(e => new Date(e.end_date) < now);

  return (
    <div className="events-page">
      <h2>Events</h2>

      {/* CURRENT EVENTS */}
      {current.length > 0 && (
        <section className="event-section current">
          <h3>HAPPENING NOW</h3>
          <div className="event-grid">
            {current.map(event => (
              <EventCard key={event.event_id} event={event} type="current" formatDate={formatDate} />
            ))}
          </div>
        </section>
      )}

      {/* UPCOMING */}
      <section className="event-section">
        <h3>Upcoming Events</h3>
        <div className="event-grid">
          {upcoming.map(event => (
            <EventCard key={event.event_id} event={event} formatDate={formatDate} />
          ))}
          {upcoming.length === 0 && <p>No upcoming events scheduled.</p>}
        </div>
      </section>

      {/* PAST */}
      <section className="event-section">
        <h3>Past Events</h3>
        <div className="event-grid">
          {past.map(event => (
            <EventCard key={event.event_id} event={event} formatDate={formatDate} isPast />
          ))}
        </div>
      </section>
    </div>
  );
}

function EventCard({ event, type, formatDate, isPast }) {
  const isCurrent = type === 'current';

  // Dynamic styles
  const cardStyle = {
    opacity: isPast ? 0.7 : 1,
    marginBottom: '1rem',
    borderLeft: isCurrent ? '5px solid var(--accent-color, #FFD700)' : '1px solid #ddd',
    boxShadow: isCurrent ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
    // Optional: Center all text in the Active card for a poster-like feel?
    // textAlign: isCurrent ? 'center' : 'left' 
  };

  const badgeStyle = {
    background: 'var(--accent-color, #FFD700)',
    color: 'var(--primary-color, #000000)',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap' // Prevents badge from breaking into two lines
  };

  return (
    <div className="card event-card" style={cardStyle}>
      
      {/* HEADER ROW: 
          justifyContent: 'center' -> Centers the Title+Badge group horizontally
          alignItems: 'center' -> Vertically aligns text and badge
      */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', // <--- This centers the group
        gap: '12px', 
        marginBottom: '0.5rem',
        flexWrap: 'wrap' // Handles very small screens gracefully
      }}>
        <h3 style={{ margin: 0, textAlign: 'center' }}>{event.name}</h3>
        
        {isCurrent && (
           <span style={badgeStyle}>
             ACTIVE
           </span>
        )}
      </div>
      
      <p className="event-date" style={{ marginTop: '0.5rem', color: '#666', textAlign: 'center' }}>
        {formatDate(event.start_date)} - {formatDate(event.end_date)}
      </p>
      
      {/* I've left these left-aligned for readability, but we can center them too if you prefer */}
      <p><strong>Location:</strong> {event.venue_name}, {event.city}</p>
      
      <p>{event.description}</p>
      
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link to={`/events/${event.slug}`}>
          <button className={isCurrent ? 'primary-button' : ''}>
             {isPast ? 'View Recap' : 'View Details'}
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Events;